import { describe, it, expect, beforeEach } from 'vitest';
import {
  JobQueueEngine,
  calculateExponentialBackoff,
  InMemoryQueueStorage,
} from '../index';

describe('Job Queue Engine (Postgres/Transactional Architecture)', () => {
  let storage: InMemoryQueueStorage;
  let queue: JobQueueEngine;

  beforeEach(() => {
    storage = new InMemoryQueueStorage();
    queue = new JobQueueEngine(storage);
  });

  it('calculates exponential backoff with bounded limits', () => {
    const base = 1000;
    const max = 30000;

    expect(calculateExponentialBackoff(1, base, max)).toBe(2000);
    expect(calculateExponentialBackoff(2, base, max)).toBe(4000);
    expect(calculateExponentialBackoff(3, base, max)).toBe(8000);
    expect(calculateExponentialBackoff(10, base, max)).toBe(max); // bounded by max
  });

  it('enqueues a job with default values and claims it', async () => {
    const job = await queue.enqueue('video.scrape', { videoUrl: 'https://www.tiktok.com/@user/video/123' });
    expect(job.id).toBeDefined();
    expect(job.status).toBe('PENDING');
    expect(job.attempts).toBe(0);

    const claimed = await queue.claimNextJob('worker-node-1');
    expect(claimed).not.toBeNull();
    expect(claimed?.id).toBe(job.id);
    expect(claimed?.status).toBe('RUNNING');
    expect(claimed?.lockedBy).toBe('worker-node-1');
  });

  it('claims higher priority jobs first', async () => {
    await queue.enqueue('low.priority', { id: 1 }, { priority: 1 });
    await queue.enqueue('high.priority', { id: 2 }, { priority: 10 });
    await queue.enqueue('med.priority', { id: 3 }, { priority: 5 });

    const first = await queue.claimNextJob('worker-1');
    expect(first?.name).toBe('high.priority');

    const second = await queue.claimNextJob('worker-1');
    expect(second?.name).toBe('med.priority');

    const third = await queue.claimNextJob('worker-1');
    expect(third?.name).toBe('low.priority');
  });

  it('does not claim jobs scheduled in the future', async () => {
    const futureDate = new Date(Date.now() + 60000);
    await queue.enqueue('future.job', {}, { runAt: futureDate });

    const claimed = await queue.claimNextJob('worker-1');
    expect(claimed).toBeNull();
  });

  it('marks claimed job as COMPLETED upon completion', async () => {
    const job = await queue.enqueue('task', {});
    await queue.claimNextJob('worker-1');

    await queue.completeJob(job.id);
    const updated = await storage.getJob(job.id);
    expect(updated?.status).toBe('COMPLETED');
  });

  it('schedules retry with exponential backoff on job failure when attempts < maxAttempts', async () => {
    const job = await queue.enqueue('flaky.task', {}, { maxAttempts: 3 });
    await queue.claimNextJob('worker-1');

    const failResult1 = await queue.failJob(job.id, new Error('Network timeout'));
    expect(failResult1.retrying).toBe(true);
    expect(failResult1.nextRunAt).toBeDefined();

    const jobAfterFail1 = await storage.getJob(job.id);
    expect(jobAfterFail1?.status).toBe('PENDING');
    expect(jobAfterFail1?.attempts).toBe(1);
    expect(jobAfterFail1?.lastError).toContain('Network timeout');
  });

  it('marks job as FAILED when attempts reach maxAttempts', async () => {
    const job = await queue.enqueue('flaky.task', {}, { maxAttempts: 2 });
    await queue.claimNextJob('worker-1');
    await queue.failJob(job.id, 'Failure 1');

    // Claim second time
    await queue.claimNextJob('worker-1');
    const failResult2 = await queue.failJob(job.id, 'Fatal error 2');

    expect(failResult2.retrying).toBe(false);
    const finalJob = await storage.getJob(job.id);
    expect(finalJob?.status).toBe('FAILED');
    expect(finalJob?.attempts).toBe(2);
  });

  it('cancels a pending job', async () => {
    const job = await queue.enqueue('to.cancel', {});
    await queue.cancelJob(job.id);

    const cancelledJob = await storage.getJob(job.id);
    expect(cancelledJob?.status).toBe('CANCELLED');

    const claimed = await queue.claimNextJob('worker-1');
    expect(claimed).toBeNull();
  });
});
