import { JobQueueEngine, InMemoryQueueStorage, QueueStorageAdapter } from './queue';
import { PostgresQueueStorage } from './queue/postgres-queue-storage';
import { globalKillSwitch, getPersistedKillSwitch } from './security/kill-switch';
import { runStealthViewSession } from './farm/stealth-runner';
import { ContentPublisher } from './content/publisher';

export type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>;

export const jobHandlerRegistry = new Map<string, JobHandler>();

export function registerJobHandler(name: string, handler: JobHandler): void {
  jobHandlerRegistry.set(name, handler);
}

export function registerDefaultJobHandlers(): void {
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

  jobHandlerRegistry.set('farm.like', async (payload) => {
    const targetUrl = String(payload.url || payload.targetUrl || '');
    if (!targetUrl) throw new Error('farm.like requires url');
    return { success: true, targetUrl, action: 'like', timestamp: new Date().toISOString() };
  });

  jobHandlerRegistry.set('farm.comment', async (payload) => {
    const targetUrl = String(payload.url || payload.targetUrl || '');
    const commentText = String(payload.comment || payload.text || 'Great content!');
    if (!targetUrl) throw new Error('farm.comment requires url');
    return { success: true, targetUrl, comment: commentText, timestamp: new Date().toISOString() };
  });

  jobHandlerRegistry.set('farm.live', async (payload) => {
    const streamUrl = String(payload.streamUrl || payload.url || '');
    if (!streamUrl) throw new Error('farm.live requires streamUrl');
    return { success: true, streamUrl, status: 'BOOSTING', timestamp: new Date().toISOString() };
  });

  jobHandlerRegistry.set('publish.upload', async (payload) => {
    const videoUrl = String(payload.videoUrl || payload.mediaUrl || '');
    const caption = String(payload.caption || '');
    if (!videoUrl) throw new Error('publish.upload requires videoUrl');
    const publisher = new ContentPublisher();
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
    return {
      success: true,
      target,
      scrapedAt: new Date().toISOString(),
      metrics: { views: 0, likes: 0, comments: 0 },
    };
  });
}

// Initial registration of default handlers
registerDefaultJobHandlers();

export async function executeJobHandler(name: string, payload: Record<string, unknown>): Promise<unknown> {
  const handler = jobHandlerRegistry.get(name);
  if (!handler) {
    throw new Error(`No handler registered for job type: ${name}`);
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

  try {
    // Assert kill switch is still not active during execution
    globalKillSwitch.assertOperationsPermitted();

    await executeJobHandler(job.name, job.payload);
    await queue.completeJob(job.id);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await queue.failJob(job.id, errorMsg);
    return true;
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
