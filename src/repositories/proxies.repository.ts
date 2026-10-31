import { prisma } from '@/lib/prisma';
import type { ProxyStatus, ProxyProtocol } from '@prisma/client';

export interface PublicProxyDTO {
  id: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  country?: string | null;
  latencyMs?: number | null;
  status: ProxyStatus;
  consecutiveErrors: number;
  lastCheckedAt?: string | null;
  createdAt: string;
}

export async function listProxies(): Promise<PublicProxyDTO[]> {
  try {
    const rows = await prisma.proxy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      protocol: r.protocol,
      host: r.host,
      port: r.port,
      country: r.country,
      latencyMs: r.latencyMs,
      status: r.status,
      consecutiveErrors: r.consecutiveErrors,
      lastCheckedAt: r.lastCheckedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createProxy(data: {
  host: string;
  port: number;
  protocol?: ProxyProtocol;
  country?: string;
  username?: string;
}): Promise<PublicProxyDTO> {
  const row = await prisma.proxy.create({
    data: {
      host: data.host.trim(),
      port: Number(data.port),
      protocol: data.protocol || 'HTTP',
      country: data.country || 'GLOBAL',
      username: data.username || null,
    },
  });

  return {
    id: row.id,
    protocol: row.protocol,
    host: row.host,
    port: row.port,
    country: row.country,
    latencyMs: row.latencyMs,
    status: row.status,
    consecutiveErrors: row.consecutiveErrors,
    lastCheckedAt: row.lastCheckedAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteProxy(id: string): Promise<boolean> {
  try {
    await prisma.proxy.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateProxyStatus(
  id: string,
  status: ProxyStatus,
  latencyMs?: number
): Promise<boolean> {
  try {
    await prisma.proxy.update({
      where: { id },
      data: {
        status,
        ...(latencyMs !== undefined ? { latencyMs } : {}),
        lastCheckedAt: new Date(),
      },
    });
    return true;
  } catch {
    return false;
  }
}
