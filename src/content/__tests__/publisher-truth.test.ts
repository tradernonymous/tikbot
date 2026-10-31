import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentPublisher, PublisherNotConfiguredError } from '../publisher';
import { KillSwitchManager } from '../../security/kill-switch';
import { JobQueueEngine, InMemoryQueueStorage } from '../../queue';
import { processNextJob, setUploaderDriver } from '../../worker';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('R0.2 Truth Pass — Content Publisher Explicit Driver Requirement', () => {
  let killSwitch: KillSwitchManager;

  beforeEach(() => {
    killSwitch = new KillSwitchManager();
    setUploaderDriver(null);
  });

  it('throws PUBLISHER_NOT_CONFIGURED when constructed without driver', () => {
    // @ts-expect-error test runtime without argument
    expect(() => new ContentPublisher()).toThrow(/PUBLISHER_NOT_CONFIGURED/);
    // @ts-expect-error test runtime with empty options
    expect(() => new ContentPublisher({})).toThrow(/PUBLISHER_NOT_CONFIGURED/);
  });

  it('succeeds construction when explicit driver is provided', () => {
    const dummyDriver = vi.fn().mockResolvedValue({
      success: true,
      publishedVideoId: 'vid-real-123',
      url: 'https://tiktok.com/@user/video/vid-real-123',
    });

    const publisher = new ContentPublisher({
      killSwitch,
      uploaderDriver: dummyDriver,
    });

    expect(publisher).toBeInstanceOf(ContentPublisher);
  });

  it('marks publish.upload job as FAILED with PUBLISHER_NOT_CONFIGURED when no driver is injected', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new JobQueueEngine(storage);

    const job = await queue.enqueue('publish.upload', {
      accountId: 'acc-real-1',
      videoUrl: '/var/media/viral.mp4',
      caption: 'Testing unconfigured publisher',
    });

    const processed = await processNextJob(queue, 'worker-pub-test');
    expect(processed).toBe(true);

    const updatedJob = await storage.getJob(job.id);
    expect(['FAILED', 'DEAD_LETTER']).toContain(updatedJob?.status);
    expect(updatedJob?.lastError).toContain('PUBLISHER_NOT_CONFIGURED');
  });

  it('marks publish.upload job as COMPLETED when an explicit driver is configured', async () => {
    const storage = new InMemoryQueueStorage();
    const queue = new JobQueueEngine(storage);

    setUploaderDriver(async (req) => ({
      success: true,
      publishedVideoId: 'real-tiktok-vid-77',
      url: `https://www.tiktok.com/@${req.accountId}/video/real-tiktok-vid-77`,
    }));

    const job = await queue.enqueue('publish.upload', {
      accountId: 'acc-real-2',
      videoUrl: '/var/media/viral2.mp4',
      caption: 'Real upload test',
    });

    const processed = await processNextJob(queue, 'worker-pub-test-2');
    expect(processed).toBe(true);

    const updatedJob = await storage.getJob(job.id);
    expect(updatedJob?.status).toBe('COMPLETED');
  });
});
