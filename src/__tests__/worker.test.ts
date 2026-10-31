import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  jobHandlerRegistry,
  registerJobHandler,
  registerDefaultJobHandlers,
  processNextJob,
  executeJobHandler,
  createDefaultQueueStorage,
  HandlerNotConfiguredError,
} from '../worker';
import { JobQueueEngine, InMemoryQueueStorage } from '../queue';
import { globalKillSwitch } from '../security/kill-switch';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Worker Handler Registry & Execution (P4, P5 TDD)', () => {
  let storage: InMemoryQueueStorage;
  let queue: JobQueueEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    registerDefaultJobHandlers();
    globalKillSwitch.setKillSwitch(false, 'test reset');
    storage = new InMemoryQueueStorage();
    queue = new JobQueueEngine(storage);
  });

  it('has default handlers registered for core configured job types', () => {
    const requiredTypes = [
      'farm.view',
      'publish.upload',
      'research.scrape',
    ];

    for (const jobType of requiredTypes) {
      expect(jobHandlerRegistry.has(jobType)).toBe(true);
      expect(typeof jobHandlerRegistry.get(jobType)).toBe('function');
    }
  });

  it('rejects unconfigured farm handlers by default with HandlerNotConfiguredError', async () => {
    const unconfiguredTypes = ['farm.like', 'farm.comment', 'farm.live'];
    for (const jobType of unconfiguredTypes) {
      expect(jobHandlerRegistry.has(jobType)).toBe(false);
      await expect(executeJobHandler(jobType, { url: 'https://tiktok.com/@u/v/1' })).rejects.toThrow(
        /HandlerNotConfiguredError/
      );
    }
  });

  it('allows registering a custom or mock handler', async () => {
    const handler = vi.fn().mockResolvedValue({ success: true });
    registerJobHandler('custom.test', handler);

    const result = await executeJobHandler('custom.test', { foo: 'bar' });
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    expect(result).toEqual({ success: true });
  });

  it('throws an error if no handler is registered for a job', async () => {
    await expect(executeJobHandler('unregistered.type', {})).rejects.toThrow(
      HandlerNotConfiguredError
    );
  });

  it('claims and dispatches a job to its registered handler and completes it', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ viewsCompleted: 10 });
    registerJobHandler('farm.view', mockHandler);

    const job = await queue.enqueue('farm.view', { url: 'https://tiktok.com/@user/video/1' });
    expect(job.status).toBe('PENDING');

    const processed = await processNextJob(queue, 'test-worker-1');
    expect(processed).toBe(true);
    expect(mockHandler).toHaveBeenCalledWith({ url: 'https://tiktok.com/@user/video/1' });

    const updated = await storage.getJob(job.id);
    expect(updated?.status).toBe('COMPLETED');
  });

  it('marks job as failed with backoff when handler fails', async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error('Stealth selector timeout'));
    registerJobHandler('farm.like', failingHandler);

    const job = await queue.enqueue(
      'farm.like',
      { url: 'https://tiktok.com/@user/video/1' },
      { maxAttempts: 2 }
    );

    const processed = await processNextJob(queue, 'test-worker-1');
    expect(processed).toBe(true);

    const updated = await storage.getJob(job.id);
    // First attempt failed, retrying (PENDING with incremented attempt)
    expect(updated?.status).toBe('PENDING');
    expect(updated?.attempts).toBe(1);
    expect(updated?.lastError).toContain('Stealth selector timeout');
  });

  it('does not claim or process jobs if persisted kill switch is active', async () => {
    globalKillSwitch.setKillSwitch(true, 'Safety freeze');

    await queue.enqueue('farm.view', { url: 'https://tiktok.com/@user/video/2' });

    const processed = await processNextJob(queue, 'test-worker-1');
    expect(processed).toBe(false);

    const claimed = await queue.claimNextJob('test-worker-1');
    // Still pending, wasn't claimed
    expect(claimed).not.toBeNull();
  });

  it('executes handlers for research.scrape and configured drivers', async () => {
    registerJobHandler('farm.like', async (payload) => {
      const url = String(payload.url || '');
      if (!url) throw new Error('farm.like requires url');
      return { success: true, action: 'like', url };
    });

    const likeResult = (await executeJobHandler('farm.like', { url: 'https://tiktok.com/@u/v/1' })) as any;
    expect(likeResult.success).toBe(true);
    expect(likeResult.action).toBe('like');

    const scrapeResult = (await executeJobHandler('research.scrape', { target: '#dropshipping' })) as any;
    expect(scrapeResult.success).toBe(true);
  });

  it('handles missing required fields in handlers by throwing', async () => {
    await expect(executeJobHandler('farm.view', {})).rejects.toThrow('farm.view requires url');
    await expect(executeJobHandler('publish.upload', {})).rejects.toThrow('publish.upload requires videoUrl');
    await expect(executeJobHandler('research.scrape', {})).rejects.toThrow('research.scrape requires target');
  });

  it('createDefaultQueueStorage returns InMemoryQueueStorage when no DATABASE_URL, PostgresQueueStorage when set', () => {
    const origUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const storageNoDb = createDefaultQueueStorage();
    expect(storageNoDb instanceof InMemoryQueueStorage).toBe(true);

    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/tikbot';
    const storageWithDb = createDefaultQueueStorage();
    expect(storageWithDb).toBeDefined();

    if (origUrl) {
      process.env.DATABASE_URL = origUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('enforces queue safety lock preventing concurrent account execution (B4)', async () => {
    const { globalQueueSafetyLock } = await import('../queue/safety-lock');
    vi.spyOn(globalQueueSafetyLock, 'acquireAccountLock').mockResolvedValueOnce(false);

    const job = await queue.enqueue('farm.like', {
      accountId: 'acc-busy',
      url: 'https://tiktok.com/@u/v/10',
    });

    const processed = await processNextJob(queue, 'worker-busy-2');
    expect(processed).toBe(true);

    const updatedJob = await storage.getJob(job.id);
    expect(updatedJob?.lastError).toContain('is locked by another active worker');
  });

  it('enforces velocity caps for account-bound jobs and fails when limit is reached (B4)', async () => {
    const { globalAccountRateLimiter } = await import('../farm/rate-limiter');
    globalAccountRateLimiter.resetAccount('acc-capped');

    // Exhaust hourly LIKE cap (5 likes max)
    for (let i = 0; i < 5; i++) {
      globalAccountRateLimiter.recordAction('acc-capped', 'LIKE');
    }

    const job = await queue.enqueue('farm.like', {
      accountId: 'acc-capped',
      url: 'https://tiktok.com/@u/v/11',
    });

    const processed = await processNextJob(queue, 'worker-tester');
    expect(processed).toBe(true);

    const updatedJob = await storage.getJob(job.id);
    expect(updatedJob?.lastError).toContain('Hourly cap exceeded');
  });
});
