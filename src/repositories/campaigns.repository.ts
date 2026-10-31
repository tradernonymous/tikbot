import { prisma } from '@/lib/prisma';
import type { CampaignStatus, CampaignActionType } from '@prisma/client';

export interface PublicCampaignDTO {
  id: string;
  title: string;
  targetUrl: string;
  actionType: CampaignActionType;
  targetCount: number;
  executedCount: number;
  status: CampaignStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
}

export async function listCampaigns(): Promise<PublicCampaignDTO[]> {
  try {
    const rows = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { actions: true },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      targetUrl: r.targetUrl,
      actionType: r.actionType,
      targetCount: r.targetCount,
      executedCount: r.executedCount,
      status: r.status,
      startedAt: r.startedAt?.toISOString() || null,
      finishedAt: r.finishedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createCampaign(data: {
  title: string;
  targetUrl: string;
  actionType: CampaignActionType;
  targetCount: number;
  status?: CampaignStatus;
}): Promise<PublicCampaignDTO> {
  const row = await prisma.campaign.create({
    data: {
      title: data.title,
      targetUrl: data.targetUrl,
      actionType: data.actionType,
      targetCount: data.targetCount,
      status: data.status || 'PENDING_APPROVAL',
    },
  });

  return {
    id: row.id,
    title: row.title,
    targetUrl: row.targetUrl,
    actionType: row.actionType,
    targetCount: row.targetCount,
    executedCount: row.executedCount,
    status: row.status,
    startedAt: row.startedAt?.toISOString() || null,
    finishedAt: row.finishedAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus
): Promise<boolean> {
  try {
    await prisma.campaign.update({
      where: { id },
      data: {
        status,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { finishedAt: new Date() } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteCampaign(id: string): Promise<boolean> {
  try {
    await prisma.campaign.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
