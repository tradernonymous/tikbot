import { prisma } from '@/lib/prisma';
import type { JobStatus } from '@prisma/client';

export interface PublicPublishJobDTO {
  id: string;
  accountId: string;
  accountUsername?: string;
  mediaAssetId: string;
  mediaStorageKey?: string;
  caption: string;
  scheduledAt: string;
  status: JobStatus;
  executedAt?: string | null;
  error?: string | null;
  createdAt: string;
}

export async function listPublishJobs(): Promise<PublicPublishJobDTO[]> {
  try {
    const rows = await prisma.publishJob.findMany({
      include: {
        account: true,
        mediaAsset: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      accountUsername: r.account?.username,
      mediaAssetId: r.mediaAssetId,
      mediaStorageKey: r.mediaAsset?.storageKey,
      caption: r.caption,
      scheduledAt: r.scheduledAt.toISOString(),
      status: r.status,
      executedAt: r.executedAt?.toISOString() || null,
      error: r.error,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createPublishJob(data: {
  accountId: string;
  mediaAssetId: string;
  caption: string;
  scheduledAt: Date | string;
  status?: JobStatus;
}): Promise<PublicPublishJobDTO> {
  const scheduled = typeof data.scheduledAt === 'string' ? new Date(data.scheduledAt) : data.scheduledAt;

  const row = await prisma.publishJob.create({
    data: {
      accountId: data.accountId,
      mediaAssetId: data.mediaAssetId,
      caption: data.caption,
      scheduledAt: scheduled,
      status: data.status || 'PENDING',
    },
    include: {
      account: true,
      mediaAsset: true,
    },
  });

  return {
    id: row.id,
    accountId: row.accountId,
    accountUsername: row.account?.username,
    mediaAssetId: row.mediaAssetId,
    mediaStorageKey: row.mediaAsset?.storageKey,
    caption: row.caption,
    scheduledAt: row.scheduledAt.toISOString(),
    status: row.status,
    executedAt: row.executedAt?.toISOString() || null,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deletePublishJob(id: string): Promise<boolean> {
  try {
    await prisma.publishJob.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export async function updatePublishJobStatus(
  id: string,
  status: JobStatus,
  error?: string
): Promise<boolean> {
  try {
    await prisma.publishJob.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { executedAt: new Date() } : {}),
        ...(error !== undefined ? { error } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}
