import { JobQueueEngine, InMemoryQueueStorage, QueueStorageAdapter } from './queue';
import { PostgresQueueStorage } from './queue/postgres-queue-storage';
import { globalQueueSafetyLock } from './queue/safety-lock';
import { globalAccountRateLimiter } from './farm/rate-limiter';
import { globalKillSwitch, getPersistedKillSwitch } from './security/kill-switch';
import { runStealthViewSession } from './farm/stealth-runner';
import { ContentPublisher, UploaderDriver, PublisherNotConfiguredError } from './content/publisher';
import { DouyinTikTokClient } from './research/download-api-client';
import { globalNotificationService } from './notifications/service';

let configuredUploaderDriver: UploaderDriver | null = null;
let configuredDouyinTikTokClient: DouyinTikTokClient = new DouyinTikTokClient();

export function setUploaderDriver(driver: UploaderDriver | null): void {
  configuredUploaderDriver = driver;
}

export function getUploaderDriver(): UploaderDriver | null {
  return configuredUploaderDriver;
}

export function setDouyinTikTokClient(client: DouyinTikTokClient): void {
  configuredDouyinTikTokClient = client;
}

export function getDouyinTikTokClient(): DouyinTikTokClient {
  return configuredDouyinTikTokClient;
}

export type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>;

export class HandlerNotConfiguredError extends Error {
  constructor(jobType: string) {
    super(`HandlerNotConfiguredError: No driver configured for job type "${jobType}". Configure driver before registering.`);
    this.name = 'HandlerNotConfiguredError';
  }
}

export const jobHandlerRegistry = new Map<string, JobHandler>();

export function registerJobHandler(name: string, handler: JobHandler): void {
  jobHandlerRegistry.set(name, handler);
}

export function registerDefaultJobHandlers(): void {
  jobHandlerRegistry.clear();

  jobHandlerRegistry.set('farm.view', async (payload) => {
    const targetUrl = String(payload.url || payload.targetUrl || '');
    if (!targetUrl) throw new Error('farm.view requires url');
    const count = Number(payload.count || payload.views || 1);
    return await runStealthViewSession({
      url: targetUrl,
      targetViews: count,
      settleDelayMs: 50,
      jitterPauseMs: 50,
    });
  });

  jobHandlerRegistry.set('publish.upload', async (payload) => {
    const videoUrl = String(payload.videoUrl || payload.mediaUrl || '');
    const caption = String(payload.caption || '');
    if (!videoUrl) throw new Error('publish.upload requires videoUrl');
    if (!configuredUploaderDriver) {
      throw new PublisherNotConfiguredError();
    }
    const publisher = new ContentPublisher({ uploaderDriver: configuredUploaderDriver });
    return await publisher.publishVideo({
      accountId: String(payload.accountId || 'system-creator'),
      mediaPath: videoUrl,
      caption,
      hasValidSession: true,
    });
  });

  jobHandlerRegistry.set('research.scrape', async (payload) => {
    const target = String(payload.target || payload.keyword || payload.url || '');
    if (!target) throw new Error('research.scrape requires target');
    const result = await configuredDouyinTikTokClient.extractVideoData(target);
    return {
      success: true,
      target,
      scrapedAt: new Date().toISOString(),
      platform: result.platform,
      postId: result.postId,
      caption: result.caption,
      author: result.author,
      metrics: {
        views: result.stats.views,
        likes: result.stats.likes,
        comments: result.stats.comments,
        shares: result.stats.shares,
      },
      playUrl: result.playUrl,
      coverUrl: result.coverUrl,
    };
  });
}

// Initial registration of default handlers
registerDefaultJobHandlers();

export async function executeJobHandler(name: string, payload: Record<string, unknown>): Promise<unknown> {
  const handler = jobHandlerRegistry.get(name);
  if (!handler) {
    throw new HandlerNotConfiguredError(name);
  }
  return await handler(payload);
}

export async function processNextJob(queue: JobQueueEngine, workerId: string): Promise<boolean> {
  // Check persisted kill switch before claiming
  const killSwitchState = await getPersistedKillSwitch();
  if (killSwitchState.active) {
    return false;
  }

  const job = await queue.claimNextJob(workerId);
  if (!job) {
    return false;
  }

  const accountId = job.payload.accountId ? String(job.payload.accountId) : undefined;
  if (accountId) {
    const lockAcquired = await globalQueueSafetyLock.acquireAccountLock(accountId, workerId);
    if (!lockAcquired) {
      await queue.failJob(job.id, `Account ${accountId} is locked by another active worker`);
      return true;
    }
  }

  try {
    // Assert kill switch is still not active during execution
    globalKillSwitch.assertOperationsPermitted();

    if (accountId && job.name.startsWith('farm.')) {
      const actionType = String(job.name.split('.')[1] || 'VIEW').toUpperCase();
      const check = await globalAccountRateLimiter.canPerformAction(accountId, actionType as any);
      if (!check.allowed) {
        throw new Error(check.reason || 'Action velocity limit exceeded');
      }
      await executeJobHandler(job.name, job.payload);
      await globalAccountRateLimiter.recordAction(accountId, actionType as any);
    } else {
      await executeJobHandler(job.name, job.payload);
    }

    await queue.completeJob(job.id);
    if (job.name === 'publish.upload') {
      await globalNotificationService.emitPublishResult(job.id, true, 'Video upload completed').catch(() => {});
    }
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await globalNotificationService.emitTaskFailure(job.id, errorMsg).catch(() => {});
    await queue.failJob(job.id, errorMsg);
    return true;
  } finally {
    if (accountId) {
      await globalQueueSafetyLock.releaseAccountLock(accountId, workerId);
    }
  }
}

export function createDefaultQueueStorage(): QueueStorageAdapter {
  if (process.env.DATABASE_URL) {
    return new PostgresQueueStorage();
  }
  return new InMemoryQueueStorage();
}

const workerId = `worker-${process.pid}-${Date.now()}`;
let isRunning = true;

export async function runWorkerLoop(storageAdapter?: QueueStorageAdapter) {
  const storage = storageAdapter ?? createDefaultQueueStorage();
  const queue = new JobQueueEngine(storage);

  console.log(`[Worker ${workerId}] Started background worker engine.`);

  while (isRunning) {
    const killSwitch = await getPersistedKillSwitch();
    if (killSwitch.active) {
      console.warn(`[Worker ${workerId}] Kill Switch is active: ${killSwitch.reason}. Pausing for 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    try {
      const processed = await processNextJob(queue, workerId);
      if (!processed) {
        // Sleep idle
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`[Worker ${workerId}] Error in loop:`, err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`[Worker ${workerId}] Shutdown complete.`);
}

function handleShutdown(signal: string) {
  console.log(`[Worker ${workerId}] Received ${signal}, shutting down gracefully...`);
  isRunning = false;
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  runWorkerLoop().catch((err) => {
    console.error(`[Worker ${workerId}] Fatal error:`, err);
    process.exit(1);
  });
}
