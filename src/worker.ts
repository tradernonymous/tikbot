import { JobQueueEngine, InMemoryQueueStorage } from './queue';
import { globalKillSwitch } from './security/kill-switch';

const workerId = `worker-${process.pid}-${Date.now()}`;
const storage = new InMemoryQueueStorage();
const queue = new JobQueueEngine(storage);

let isRunning = true;

async function runWorkerLoop() {
  console.log(`[Worker ${workerId}] Started background worker engine.`);

  while (isRunning) {
    if (globalKillSwitch.isActive()) {
      console.warn(`[Worker ${workerId}] Kill Switch is active. Pausing queue processing for 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    try {
      const job = await queue.claimNextJob(workerId);
      if (job) {
        console.log(`[Worker ${workerId}] Claimed job: ${job.name} (${job.id})`);
        // Dispatch job by name
        await queue.completeJob(job.id);
        console.log(`[Worker ${workerId}] Finished job: ${job.name} (${job.id})`);
      } else {
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

if (process.env.NODE_ENV !== 'test') {
  runWorkerLoop().catch((err) => {
    console.error(`[Worker ${workerId}] Fatal error:`, err);
    process.exit(1);
  });
}
