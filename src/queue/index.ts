export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface JobRecord {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  priority: number;
  runAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  attempts: number;
  maxAttempts: number;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueOptions {
  priority?: number;
  runAt?: Date;
  maxAttempts?: number;
}

export interface QueueStorageAdapter {
  insert(job: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobRecord>;
  claimNext(workerId: string): Promise<JobRecord | null>;
  getJob(id: string): Promise<JobRecord | null>;
  updateJob(id: string, updates: Partial<JobRecord>): Promise<JobRecord>;
}

export function calculateExponentialBackoff(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 60000
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}

export class InMemoryQueueStorage implements QueueStorageAdapter {
  private jobs = new Map<string, JobRecord>();
  private counter = 0;

  async insert(jobData: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobRecord> {
    this.counter++;
    const now = new Date();
    const job: JobRecord = {
      ...jobData,
      id: `job-${this.counter}-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return { ...job };
  }

  async claimNext(workerId: string): Promise<JobRecord | null> {
    const now = new Date();
    const eligible: JobRecord[] = [];

    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING' && job.runAt <= now) {
        eligible.push(job);
      }
    }

    if (eligible.length === 0) {
      return null;
    }

    // Sort by priority DESC, runAt ASC
    eligible.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.runAt.getTime() - b.runAt.getTime();
    });

    const chosen = eligible[0];
    const updated: JobRecord = {
      ...chosen,
      status: 'RUNNING',
      lockedAt: now,
      lockedBy: workerId,
      updatedAt: now,
    };
    this.jobs.set(chosen.id, updated);
    return { ...updated };
  }

  async getJob(id: string): Promise<JobRecord | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async updateJob(id: string, updates: Partial<JobRecord>): Promise<JobRecord> {
    const existing = this.jobs.get(id);
    if (!existing) {
      throw new Error(`Job not found: ${id}`);
    }
    const updated: JobRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.jobs.set(id, updated);
    return { ...updated };
  }
}

export class JobQueueEngine {
  constructor(private storage: QueueStorageAdapter) {}

  async enqueue(
    name: string,
    payload: Record<string, unknown>,
    options: EnqueueOptions = {}
  ): Promise<JobRecord> {
    return this.storage.insert({
      name,
      payload,
      status: 'PENDING',
      priority: options.priority ?? 0,
      runAt: options.runAt ?? new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    });
  }

  async claimNextJob(workerId: string): Promise<JobRecord | null> {
    return this.storage.claimNext(workerId);
  }

  async completeJob(jobId: string): Promise<void> {
    await this.storage.updateJob(jobId, {
      status: 'COMPLETED',
      lockedAt: null,
      lockedBy: null,
    });
  }

  async failJob(
    jobId: string,
    error: Error | string
  ): Promise<{ retrying: boolean; nextRunAt?: Date }> {
    const job = await this.storage.getJob(jobId);
    if (!job) {
      throw new Error(`Cannot fail non-existent job: ${jobId}`);
    }

    const errorMessage = error instanceof Error ? error.message : error;
    const nextAttempts = job.attempts + 1;

    if (nextAttempts >= job.maxAttempts) {
      await this.storage.updateJob(jobId, {
        status: 'FAILED',
        attempts: nextAttempts,
        lastError: errorMessage,
        lockedAt: null,
        lockedBy: null,
      });
      return { retrying: false };
    }

    const backoffMs = calculateExponentialBackoff(nextAttempts);
    const nextRunAt = new Date(Date.now() + backoffMs);

    await this.storage.updateJob(jobId, {
      status: 'PENDING',
      attempts: nextAttempts,
      runAt: nextRunAt,
      lastError: errorMessage,
      lockedAt: null,
      lockedBy: null,
    });

    return { retrying: true, nextRunAt };
  }

  async cancelJob(jobId: string): Promise<void> {
    await this.storage.updateJob(jobId, {
      status: 'CANCELLED',
      lockedAt: null,
      lockedBy: null,
    });
  }
}
