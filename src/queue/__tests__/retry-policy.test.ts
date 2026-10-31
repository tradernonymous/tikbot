import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  JobQueueEngine,
  InMemoryQueueStorage,
  calculateBackoffWithJitter,
  isTerminalJobError,
  getJobRetryPolicy,
} from '../index';

describe('Job Retry Policy, Error Classification & Dead-Letter (R3.4)', () => {
  let storage: InMemoryQueueStorage;
  let queue: JobQueueEngine;

  beforeEach(() => {
    storage = new InMemoryQueueStorage();
    queue = new JobQueueEngine(storage);
  });

  describe('calculateBackoffWithJitter', () => {
    it('calculates exponential backoff with jitter within bounded range', () => {
      const delay0 = calculateBackoffWithJitter(0, 1000, 30000, 0.2);
      expect(delay0).toBeGreaterThanOrEqual(800);
      expect(delay0).toBeLessThanOrEqual(1200);

      const delay1 = calculateBackoffWithJitter(1, 1000, 30000, 0.2);
      expect(delay1).toBeGreaterThanOrEqual(1600);
      expect(delay1).toBeLessThanOrEqual(2400);

      const delayCapped = calculateBackoffWithJitter(10, 1000, 10000, 0);
      expect(delayCapped).toBe(10000);
    });
  });

  describe('isTerminalJobError', () => {
    it('classifies configuration, bad payload, and cap errors as terminal', () => {
      expect(isTerminalJobError(new Error('PUBLISHER_NOT_CONFIGURED'))).toBe(true);
      expect(isTerminalJobError(new Error('HandlerNotConfiguredError: farm.like'))).toBe(true);
      expect(isTerminalJobError(new Error('Action cap exceeded: Hourly cap'))).toBe(true);
      expect(isTerminalJobError(new Error('Invalid payload: missing videoUrl'))).toBe(true);
    });

    it('classifies network timeouts and proxy disconnects as retryable', () => {
      expect(isTerminalJobError(new Error('Navigation timeout of 35000 ms exceeded'))).toBe(false);
      expect(isTerminalJobError(new Error('net::ERR_PROXY_CONNECTION_FAILED'))).toBe(false);
      expect(isTerminalJobError(new Error('fetch failed: ECONNRESET'))).toBe(false);
    });
  });

  describe('getJobRetryPolicy', () => {
    it('returns custom maxAttempts per job type', () => {
      expect(getJobRetryPolicy('publish.upload').maxAttempts).toBe(2);
      expect(getJobRetryPolicy('farm.view').maxAttempts).toBe(3);
      expect(getJobRetryPolicy('research.scrape').maxAttempts).toBe(3);
      expect(getJobRetryPolicy('unknown.job').maxAttempts).toBe(3);
    });
  });

  describe('Dead-letter state handling in JobQueueEngine', () => {
    it('retries transient errors until maxAttempts is reached', async () => {
      const job = await queue.enqueue('farm.view', { url: 'https://tiktok.com/@u/v/1' }, { maxAttempts: 3 });
      await queue.claimNextJob('w1');

      // Attempt 1: transient timeout -> retrying
      const fail1 = await queue.failJob(job.id, new Error('Navigation timeout exceeded'));
      expect(fail1.retrying).toBe(true);
      const after1 = await storage.getJob(job.id);
      expect(after1?.status).toBe('PENDING');
      expect(after1?.attempts).toBe(1);

      // Attempt 2: transient proxy error -> retrying
      await queue.claimNextJob('w1');
      const fail2 = await queue.failJob(job.id, new Error('net::ERR_PROXY_CONNECTION_FAILED'));
      expect(fail2.retrying).toBe(true);
      const after2 = await storage.getJob(job.id);
      expect(after2?.status).toBe('PENDING');
      expect(after2?.attempts).toBe(2);

      // Attempt 3: transient error -> reaches maxAttempts (3) -> DEAD_LETTER
      await queue.claimNextJob('w1');
      const fail3 = await queue.failJob(job.id, new Error('Navigation timeout exceeded'));
      expect(fail3.retrying).toBe(false);
      const after3 = await storage.getJob(job.id);
      expect(after3?.status).toBe('DEAD_LETTER');
      expect(after3?.deadLetterReason).toContain('Max attempts reached');
    });

    it('immediately moves terminal errors to DEAD_LETTER without retrying', async () => {
      const job = await queue.enqueue('farm.like', { url: 'https://tiktok.com/@u/v/1' }, { maxAttempts: 3 });
      await queue.claimNextJob('w1');

      const fail = await queue.failJob(job.id, new Error('Action cap exceeded: Hourly cap reached (5/5)'));
      expect(fail.retrying).toBe(false);

      const updated = await storage.getJob(job.id);
      expect(updated?.status).toBe('DEAD_LETTER');
      expect(updated?.deadLetterReason).toContain('Terminal error');
    });
  });

  describe('Idempotency key on enqueue', () => {
    it('returns existing job and prevents duplicate enqueueing when idempotencyKey matches', async () => {
      const job1 = await queue.enqueue(
        'farm.view',
        { url: 'https://tiktok.com/@u/v/100' },
        { idempotencyKey: 'idem-view-100' }
      );

      const job2 = await queue.enqueue(
        'farm.view',
        { url: 'https://tiktok.com/@u/v/100' },
        { idempotencyKey: 'idem-view-100' }
      );

      expect(job2.id).toBe(job1.id);
    });
  });
});
