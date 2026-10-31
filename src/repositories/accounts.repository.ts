import { prisma } from '@/lib/prisma';
import type { AccountStatus } from '@prisma/client';

export interface PublicAccountDTO {
  id: string;
  username: string;
  platform: 'TIKTOK' | 'DOUYIN';
  status: AccountStatus;
  healthScore: number;
  actionsToday: number;
  dailyCap: number;
  proxyId: string | null;
  warmupDay?: number;
  hasCookies: boolean;
  proxyHost?: string;
  createdAt: string;
}

export async function listAccounts(): Promise<PublicAccountDTO[]> {
  try {
    const rows = await prisma.platformAccount.findMany({
      include: { proxy: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      platform: (r.platform as 'TIKTOK' | 'DOUYIN') || 'TIKTOK',
      status: r.status,
      healthScore: r.healthScore,
      actionsToday: r.actionsToday,
      dailyCap: r.dailyCap,
      proxyId: r.proxyId,
      hasCookies: Boolean(r.encryptedCookies),
      proxyHost: r.proxy?.host,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createAccount(data: {
  username: string;
  platform?: 'TIKTOK' | 'DOUYIN';
  proxyId?: string | null;
  dailyCap?: number;
}): Promise<PublicAccountDTO> {
  const row = await prisma.platformAccount.create({
    data: {
      username: data.username.replace(/^@/, '').trim(),
      platform: data.platform || 'TIKTOK',
      proxyId: data.proxyId || null,
      dailyCap: data.dailyCap || 80,
    },
    include: { proxy: true },
  });

  return {
    id: row.id,
    username: row.username,
    platform: (row.platform as 'TIKTOK' | 'DOUYIN') || 'TIKTOK',
    status: row.status,
    healthScore: row.healthScore,
    actionsToday: row.actionsToday,
    dailyCap: row.dailyCap,
    proxyId: row.proxyId,
    hasCookies: Boolean(row.encryptedCookies),
    proxyHost: row.proxy?.host,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteAccount(id: string): Promise<boolean> {
  try {
    await prisma.platformAccount.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateAccountStatus(id: string, status: AccountStatus): Promise<boolean> {
  try {
    await prisma.platformAccount.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch {
    return false;
  }
}
