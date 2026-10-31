import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostgresQueueStorage } from '../postgres-queue-storage';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

describe('PostgresQueueStorage (P5 TDD)', () => {
  let storage: PostgresQueueStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new PostgresQueueStorage({ visibilityTimeoutMs: 60000 });
  });

  it('inserts a new job into the database with PENDING status', async () => {
    const now = new Date();
    vi.mocked(prisma.job.create).mockResolvedValue({
      id: 'job-pg-1',
      name: 'farm.view',
      payload: { url: 'https://tiktok.com/@test/video/1' },
      status: 'PENDING',
      priority: 10,
      runAt: now,
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });

    const job = await storage.insert({
      name: 'farm.view',
      payload: { url: 'https://tiktok.com/@test/video/1' },
      status: 'PENDING',
      priority: 10,
      runAt: now,
      attempts: 0,
      maxAttempts: 3,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    });

    expect(prisma.job.create).toHaveBeenCalledTimes(1);
    expect(job.id).toBe('job-pg-1');
    expect(job.status).toBe('PENDING');
  });

  it('claims the next eligible job atomically using SKIP LOCKED', async () => {
    const now = new Date();
    const claimedRow = {
      id: 'job-pg-1',
      name: 'farm.view',
      payload: { url: 'https://tiktok.com/@test/video/1' },
      status: 'RUNNING',
      priority: 10,
      runAt: now,
      lockedAt: now,
      lockedBy: 'worker-unit-1',
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };

    vi.mocked(prisma.$queryRaw).mockResolvedValue([claimedRow]);

    const claimed = await storage.claimNext('worker-unit-1');
    expect(claimed).not.toBeNull();
    expect(claimed?.id).toBe('job-pg-1');
    expect(claimed?.status).toBe('RUNNING');
    expect(claimed?.lockedBy).toBe('worker-unit-1');
  });

  it('returns null when no pending job is available', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

    const claimed = await storage.claimNext('worker-unit-1');
    expect(claimed).toBeNull();
  });

  it('reclaims stale RUNNING jobs when visibility timeout expires', async () => {
    const staleTime = new Date(Date.now() - 70000); // older than 60s
    vi.mocked(prisma.job.findMany).mockResolvedValue([
      {
        id: 'job-stale-1',
        name: 'farm.view',
        payload: {},
        status: 'RUNNING',
        priority: 5,
        runAt: staleTime,
        lockedAt: staleTime,
        lockedBy: 'dead-worker',
        attempts: 1,
        maxAttempts: 3,
        lastError: null,
        createdAt: staleTime,
        updatedAt: staleTime,
      },
    ]);

    vi.mocked(prisma.job.update).mockResolvedValue({} as any);

    const reclaimedCount = await storage.reclaimStaleJobs();
    expect(reclaimedCount).toBe(1);
    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-stale-1' },
        data: expect.objectContaining({
          status: 'PENDING',
          lockedAt: null,
          lockedBy: null,
          attempts: 2,
        }),
      })
    );
  });

  it('marks job FAILED if stale reclaim reaches maxAttempts', async () => {
    const staleTime = new Date(Date.now() - 70000);
    vi.mocked(prisma.job.findMany).mockResolvedValue([
      {
        id: 'job-stale-2',
        name: 'farm.like',
        payload: {},
        status: 'RUNNING',
        priority: 5,
        runAt: staleTime,
        lockedAt: staleTime,
        lockedBy: 'dead-worker',
        attempts: 2,
        maxAttempts: 3,
        lastError: null,
        createdAt: staleTime,
        updatedAt: staleTime,
      },
    ]);

    vi.mocked(prisma.job.update).mockResolvedValue({} as any);

    await storage.reclaimStaleJobs();
    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-stale-2' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: expect.stringContaining('Visibility timeout exceeded'),
        }),
      })
    );
  });

  it('gets a job by id', async () => {
    const now = new Date();
    vi.mocked(prisma.job.findUnique).mockResolvedValue({
      id: 'job-1',
      name: 'farm.view',
      payload: {},
      status: 'PENDING',
      priority: 0,
      runAt: now,
      lockedAt: null,
      lockedBy: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });

    const job = await storage.getJob('job-1');
    expect(job?.id).toBe('job-1');
  });

  it('updates a job by id', async () => {
    const now = new Date();
    vi.mocked(prisma.job.update).mockResolvedValue({
      id: 'job-1',
      name: 'farm.view',
      payload: {},
      status: 'COMPLETED',
      priority: 0,
      runAt: now,
      lockedAt: null,
      lockedBy: null,
      attempts: 1,
      maxAttempts: 3,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });

    const job = await storage.updateJob('job-1', { status: 'COMPLETED' });
    expect(job.status).toBe('COMPLETED');
  });

  it('returns null when getJob does not find any job', async () => {
    vi.mocked(prisma.job.findUnique).mockResolvedValue(null);
    const job = await storage.getJob('non-existent');
    expect(job).toBeNull();
  });

  it('handles raw query failure during claimNext gracefully by returning null', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection terminated'));
    const job = await storage.claimNext('worker-1');
    expect(job).toBeNull();
  });

  it('updates all job fields including attempts, priority, lockedAt, lockedBy, lastError, and payload', async () => {
    const now = new Date();
    vi.mocked(prisma.job.update).mockResolvedValue({
      id: 'job-all',
      name: 'farm.view',
      payload: { custom: 123 },
      status: 'RUNNING',
      priority: 50,
      runAt: now,
      lockedAt: now,
      lockedBy: 'worker-2',
      attempts: 2,
      maxAttempts: 5,
      lastError: 'Temporary network failure',
      createdAt: now,
      updatedAt: now,
    });

    const updated = await storage.updateJob('job-all', {
      status: 'RUNNING',
      priority: 50,
      runAt: now,
      lockedAt: now,
      lockedBy: 'worker-2',
      attempts: 2,
      lastError: 'Temporary network failure',
      payload: { custom: 123 },
    });

    expect(updated.id).toBe('job-all');
    expect(updated.priority).toBe(50);
    expect(updated.lockedBy).toBe('worker-2');
  });
});
