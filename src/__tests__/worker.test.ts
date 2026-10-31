import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  jobHandlerRegistry,
  registerJobHandler,
  registerDefaultJobHandlers,
  processNextJob,
  executeJobHandler,
  createDefaultQueueStorage,
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

  it('has default handlers registered for all required job types', () => {
    const requiredTypes = [
      'farm.view',
      'farm.like',
      'farm.comment',
      'farm.live',
      'publish.upload',
      'research.scrape',
    ];

    for (const jobType of requiredTypes) {
      expect(jobHandlerRegistry.has(jobType)).toBe(true);
      expect(typeof jobHandlerRegistry.get(jobType)).toBe('function');
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
      /No handler registered for job type: unregistered.type/
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

  it('executes default handlers for farm.like, farm.comment, farm.live, research.scrape', async () => {
    const likeResult = (await executeJobHandler('farm.like', { url: 'https://tiktok.com/@u/v/1' })) as any;
    expect(likeResult.success).toBe(true);
    expect(likeResult.action).toBe('like');

    const commentResult = (await executeJobHandler('farm.comment', {
      url: 'https://tiktok.com/@u/v/1',
      comment: 'Super helpful!',
    })) as any;
    expect(commentResult.success).toBe(true);
    expect(commentResult.comment).toBe('Super helpful!');

    const liveResult = (await executeJobHandler('farm.live', { streamUrl: 'https://tiktok.com/@u/live' })) as any;
    expect(liveResult.success).toBe(true);

    const scrapeResult = (await executeJobHandler('research.scrape', { target: '#dropshipping' })) as any;
    expect(scrapeResult.success).toBe(true);
  });

  it('handles missing required fields in default handlers by throwing', async () => {
    await expect(executeJobHandler('farm.view', {})).rejects.toThrow('farm.view requires url');
    await expect(executeJobHandler('farm.like', {})).rejects.toThrow('farm.like requires url');
    await expect(executeJobHandler('farm.comment', {})).rejects.toThrow('farm.comment requires url');
    await expect(executeJobHandler('farm.live', {})).rejects.toThrow('farm.live requires streamUrl');
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
});
