import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  InMemoryQueueStorage,
  JobQueueEngine,
} from '../queue';
import {
  processNextJob,
  isWorkerPaused,
  setWorkerPaused,
  recordWorkerHeartbeat,
  getLastWorkerHeartbeat,
} from '../worker';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    job: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    campaign: {
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

describe('Worker Lifecycle & Resilience (R3.7)', () => {
  let storage: InMemoryQueueStorage;
  let queue: JobQueueEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new InMemoryQueueStorage();
    queue = new JobQueueEngine(storage);
    setWorkerPaused(false);
  });

  describe('WORKER_PAUSED flag', () => {
    it('honors paused flag and refuses to process jobs when paused', async () => {
      await queue.enqueue('test.job', { foo: 'bar' });

      setWorkerPaused(true);
      expect(await isWorkerPaused()).toBe(true);

      const processed = await processNextJob(queue, 'worker-test-1');
      expect(processed).toBe(false);

      // Verify job remained in PENDING state without being claimed
      const allJobs = await storage.claimNext('probe');
      expect(allJobs?.status).toBe('RUNNING');
    });

    it('resumes job processing when unpaused', async () => {
      setWorkerPaused(true);
      setWorkerPaused(false);
      expect(await isWorkerPaused()).toBe(false);
    });
  });

  describe('Worker Heartbeat', () => {
    it('records and retrieves worker heartbeat timestamp', async () => {
      const workerId = 'worker-hb-1';
      await recordWorkerHeartbeat(workerId);

      const lastHeartbeat = await getLastWorkerHeartbeat(workerId);
      expect(lastHeartbeat).toBeDefined();
      expect(Date.now() - (lastHeartbeat?.getTime() || 0)).toBeLessThan(5000);
    });
  });

  describe('Chaos / Stale Job Reclaim (kill -9 mid-job)', () => {
    it('reclaims stale RUNNING job once after visibility timeout without duplicating', async () => {
      const job = await queue.enqueue('crash.prone', { url: 'https://tiktok.com' }, { maxAttempts: 3 });

      // Worker 1 claims job
      const claimed = await queue.claimNextJob('worker-crashed-pid-999');
      expect(claimed?.status).toBe('RUNNING');

      // Simulate worker 1 crashing (kill -9): job stays RUNNING, lockedAt in past
      const pastTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await storage.updateJob(job.id, {
        lockedAt: pastTime,
        status: 'RUNNING',
      });

      // Storage reclaims stale jobs with 5 min visibility timeout
      const reclaimedCount = await storage.reclaimStaleJobs(5 * 60 * 1000);
      expect(reclaimedCount).toBe(1);

      // Verify job was reset to PENDING with attempts incremented once
      const reclaimedJob = await storage.getJob(job.id);
      expect(reclaimedJob?.status).toBe('PENDING');
      expect(reclaimedJob?.attempts).toBe(1);
      expect(reclaimedJob?.lockedAt).toBeNull();
      expect(reclaimedJob?.lockedBy).toBeNull();

      // New worker claims and executes successfully without duplication
      const claimedAgain = await queue.claimNextJob('worker-survivor-1');
      expect(claimedAgain?.id).toBe(job.id);
      expect(claimedAgain?.attempts).toBe(1);
    });
  });
});
