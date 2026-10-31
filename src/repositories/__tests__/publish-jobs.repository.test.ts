import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listPublishJobs,
  createPublishJob,
  deletePublishJob,
  updatePublishJobStatus,
} from '../publish-jobs.repository';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishJob: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Publish Jobs Repository (P3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists publish jobs with relation details', async () => {
    const scheduled = new Date();
    vi.mocked(prisma.publishJob.findMany).mockResolvedValue([
      {
        id: 'pub-1',
        accountId: 'acc-1',
        mediaAssetId: 'asset-1',
        caption: 'Viral TikTok Video #fyp',
        scheduledAt: scheduled,
        status: 'PENDING',
        approvalId: null,
        executedAt: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        account: { username: 'creator_one' } as any,
        mediaAsset: { storageKey: 'uploads/vid1.mp4' } as any,
      } as any,
    ]);

    const jobs = await listPublishJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].caption).toBe('Viral TikTok Video #fyp');
    expect(jobs[0].accountUsername).toBe('creator_one');
    expect(jobs[0].mediaStorageKey).toBe('uploads/vid1.mp4');
  });

  it('creates and schedules a publish job', async () => {
    const scheduled = new Date();
    vi.mocked(prisma.publishJob.create).mockResolvedValue({
      id: 'pub-2',
      accountId: 'acc-2',
      mediaAssetId: 'asset-2',
      caption: 'New Video',
      scheduledAt: scheduled,
      status: 'PENDING',
      approvalId: null,
      executedAt: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      account: { username: 'creator_two' } as any,
      mediaAsset: { storageKey: 'uploads/vid2.mp4' } as any,
    } as any);

    const job = await createPublishJob({
      accountId: 'acc-2',
      mediaAssetId: 'asset-2',
      caption: 'New Video',
      scheduledAt: scheduled,
    });

    expect(job.id).toBe('pub-2');
    expect(prisma.publishJob.create).toHaveBeenCalled();
  });

  it('updates publish job status and records errors', async () => {
    vi.mocked(prisma.publishJob.update).mockResolvedValue({ id: 'pub-1' } as any);

    const success = await updatePublishJobStatus('pub-1', 'FAILED', 'TikTok upload rejected');
    expect(success).toBe(true);
    expect(prisma.publishJob.update).toHaveBeenCalledWith({
      where: { id: 'pub-1' },
      data: expect.objectContaining({ status: 'FAILED', error: 'TikTok upload rejected' }),
    });
  });

  it('deletes publish job', async () => {
    vi.mocked(prisma.publishJob.delete).mockResolvedValue({ id: 'pub-1' } as any);
    const success = await deletePublishJob('pub-1');
    expect(success).toBe(true);
    expect(prisma.publishJob.delete).toHaveBeenCalledWith({ where: { id: 'pub-1' } });
  });
});
