import { prisma } from '@/lib/prisma';
import crypto from 'node:crypto';

export type OrderStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'ABORTED';

export interface FarmBoostOrderRecord {
  id: string;
  targetUrl: string;
  targetHandle: string;
  goalTier: string;
  targetReach: number;
  status: OrderStatus;
  progressPercent: number;
  plausibilityScore: number;
  lastError?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

const ordersStore = new Map<string, FarmBoostOrderRecord>();

export async function persistOrderToPrisma(order: FarmBoostOrderRecord): Promise<void> {
  try {
    if (prisma && prisma.farmBoostOrder && (process.env.DATABASE_URL || (prisma.farmBoostOrder.upsert as any)?.mock)) {
      await prisma.farmBoostOrder.upsert({
        where: { id: order.id },
        update: {
          status: order.status,
          targetUrl: order.targetUrl,
          targetHandle: order.targetHandle,
          goalTier: order.goalTier,
          targetReach: order.targetReach,
          stats: {
            progressPercent: order.progressPercent,
            plausibilityScore: order.plausibilityScore,
            retryCount: order.retryCount,
            lastError: order.lastError,
          },
        },
        create: {
          id: order.id,
          targetUrl: order.targetUrl,
          targetHandle: order.targetHandle,
          goalTier: order.goalTier,
          targetReach: order.targetReach,
          status: order.status,
          stats: {
            progressPercent: order.progressPercent,
            plausibilityScore: order.plausibilityScore,
            retryCount: order.retryCount,
            lastError: order.lastError,
          },
        },
      });
    }
  } catch {}
}

export function enqueueOrder(input: {
  targetUrl: string;
  targetHandle: string;
  goalTier: string;
  targetReach: number;
  plausibilityScore: number;
}): FarmBoostOrderRecord {
  const id = `order-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
  const now = new Date().toISOString();
  const order: FarmBoostOrderRecord = {
    id,
    targetUrl: input.targetUrl,
    targetHandle: input.targetHandle,
    goalTier: input.goalTier,
    targetReach: input.targetReach,
    status: 'RUNNING',
    progressPercent: 0,
    plausibilityScore: input.plausibilityScore,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  ordersStore.set(id, order);
  persistOrderToPrisma(order);
  return order;
}

export function pauseOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'PAUSED';
  order.updatedAt = new Date().toISOString();
  persistOrderToPrisma(order);
  return order;
}

export function resumeOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'RUNNING';
  order.updatedAt = new Date().toISOString();
  persistOrderToPrisma(order);
  return order;
}

export function abortOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'ABORTED';
  order.updatedAt = new Date().toISOString();
  persistOrderToPrisma(order);
  return order;
}

export function retryFailedOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'RUNNING';
  order.retryCount += 1;
  order.lastError = undefined;
  order.updatedAt = new Date().toISOString();
  persistOrderToPrisma(order);
  return order;
}

export function getOrderStatus(id: string): FarmBoostOrderRecord | undefined {
  return ordersStore.get(id);
}

let defaultOrdersSeeded = false;

export function seedDefaultOrders(): void {
  if (defaultOrdersSeeded) return;
  defaultOrdersSeeded = true;
  const now = new Date().toISOString();
  ordersStore.set('order-baseline-1', {
    id: 'order-baseline-1',
    targetUrl: 'https://tiktok.com/@growth_lab/video/718291039',
    targetHandle: '@growth_lab',
    goalTier: 'PRIME',
    targetReach: 500,
    status: 'RUNNING',
    progressPercent: 44,
    plausibilityScore: 92,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  ordersStore.set('order-baseline-2', {
    id: 'order-baseline-2',
    targetUrl: 'https://tiktok.com/@vibe_kitchen/video/789218291',
    targetHandle: '@vibe_kitchen',
    goalTier: 'MATURE',
    targetReach: 1200,
    status: 'COMPLETED',
    progressPercent: 100,
    plausibilityScore: 88,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export function listOrders(): FarmBoostOrderRecord[] {
  if (!defaultOrdersSeeded && ordersStore.size === 0) {
    seedDefaultOrders();
  }
  return Array.from(ordersStore.values());
}

export function clearOrders(): void {
  ordersStore.clear();
  defaultOrdersSeeded = true;
}

export function resetOrderStore(): void {
  ordersStore.clear();
  defaultOrdersSeeded = false;
}

/**
 * Reloads orders from Prisma database, restoring state across process restarts.
 */
export async function reloadOrdersFromPrisma(): Promise<void> {
  try {
    if (prisma && prisma.farmBoostOrder && (process.env.DATABASE_URL || (prisma.farmBoostOrder.findMany as any)?.mock)) {
      const records = await prisma.farmBoostOrder.findMany();
      if (records && records.length > 0) {
        ordersStore.clear();
        defaultOrdersSeeded = true;
        for (const r of records) {
          const stats = (r.stats as any) || {};
          ordersStore.set(r.id, {
            id: r.id,
            targetUrl: r.targetUrl,
            targetHandle: r.targetHandle,
            goalTier: r.goalTier,
            targetReach: r.targetReach,
            status: r.status as OrderStatus,
            progressPercent: stats.progressPercent ?? (r.status === 'COMPLETED' ? 100 : 0),
            plausibilityScore: stats.plausibilityScore ?? 90,
            lastError: stats.lastError,
            retryCount: stats.retryCount ?? 0,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
            updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
          });
        }
      }
    }
  } catch {}
}
