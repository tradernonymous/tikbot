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

export function enqueueOrder(input: {
  targetUrl: string;
  targetHandle: string;
  goalTier: string;
  targetReach: number;
  plausibilityScore: number;
}): FarmBoostOrderRecord {
  const id = `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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
  return order;
}

export function pauseOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'PAUSED';
  order.updatedAt = new Date().toISOString();
  return order;
}

export function resumeOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'RUNNING';
  order.updatedAt = new Date().toISOString();
  return order;
}

export function abortOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'ABORTED';
  order.updatedAt = new Date().toISOString();
  return order;
}

export function retryFailedOrder(id: string): FarmBoostOrderRecord {
  const order = ordersStore.get(id);
  if (!order) throw new Error(`Order ${id} not found`);
  order.status = 'RUNNING';
  order.retryCount += 1;
  order.lastError = undefined;
  order.updatedAt = new Date().toISOString();
  return order;
}

export function getOrderStatus(id: string): FarmBoostOrderRecord | undefined {
  return ordersStore.get(id);
}

export function listOrders(): FarmBoostOrderRecord[] {
  if (ordersStore.size === 0) {
    // Return sample seeded orders if store is empty
    const now = new Date().toISOString();
    return [
      {
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
      },
      {
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
      },
    ];
  }
  return Array.from(ordersStore.values());
}

export function clearOrders(): void {
  ordersStore.clear();
}
