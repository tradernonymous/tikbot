export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'DEAD_LETTER';

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
  deadLetterReason?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueOptions {
  priority?: number;
  runAt?: Date;
  maxAttempts?: number;
  idempotencyKey?: string;
}

export interface QueueStorageAdapter {
  insert(job: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobRecord>;
  claimNext(workerId: string): Promise<JobRecord | null>;
  getJob(id: string): Promise<JobRecord | null>;
  updateJob(id: string, updates: Partial<JobRecord>): Promise<JobRecord>;
  findByIdempotencyKey?(key: string): Promise<JobRecord | null>;
}

export function calculateExponentialBackoff(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 60000
): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, maxDelayMs);
}

export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 60000,
  jitterRatio = 0.2
): number {
  const rawDelay = baseDelayMs * Math.pow(2, attempt);
  const bounded = Math.min(rawDelay, maxDelayMs);
  if (jitterRatio <= 0) return bounded;
  const delta = bounded * jitterRatio;
  const jitter = (Math.random() * 2 - 1) * delta;
  return Math.round(bounded + jitter);
}

export function isTerminalJobError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  const lower = msg.toLowerCase();
  if (
    lower.includes('publisher_not_configured') ||
    lower.includes('handlernotconfigurederror') ||
    lower.includes('action cap exceeded') ||
    lower.includes('invalid payload') ||
    lower.includes('terminal') ||
    lower.includes('account banned') ||
    lower.includes('unauthorized') ||
    lower.includes('credentials not configured')
  ) {
    return true;
  }
  return false;
}

export interface JobRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_POLICIES: Record<string, JobRetryPolicy> = {
  'publish.upload': { maxAttempts: 2, baseDelayMs: 2000, maxDelayMs: 30000 },
  'farm.view': { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 60000 },
  'farm.like': { maxAttempts: 2, baseDelayMs: 1500, maxDelayMs: 30000 },
  'farm.comment': { maxAttempts: 2, baseDelayMs: 2000, maxDelayMs: 30000 },
  'farm.live': { maxAttempts: 2, baseDelayMs: 2000, maxDelayMs: 30000 },
  'research.scrape': { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 45000 },
  'research.watch': { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 45000 },
  'metrics.collect': { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 45000 },
};

export function getJobRetryPolicy(jobName: string): JobRetryPolicy {
  return (
    DEFAULT_RETRY_POLICIES[jobName] || {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 60000,
    }
  );
}

export class InMemoryQueueStorage implements QueueStorageAdapter {
  private jobs = new Map<string, JobRecord>();
  private idempotencyIndex = new Map<string, string>();
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
    if (job.idempotencyKey) {
      this.idempotencyIndex.set(job.idempotencyKey, job.id);
    }
    return { ...job };
  }

  async findByIdempotencyKey(key: string): Promise<JobRecord | null> {
    const jobId = this.idempotencyIndex.get(key);
    if (!jobId) return null;
    return this.getJob(jobId);
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
    if (options.idempotencyKey && typeof this.storage.findByIdempotencyKey === 'function') {
      const existing = await this.storage.findByIdempotencyKey(options.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const policy = getJobRetryPolicy(name);
    return this.storage.insert({
      name,
      payload,
      status: 'PENDING',
      priority: options.priority ?? 0,
      runAt: options.runAt ?? new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? policy.maxAttempts,
      idempotencyKey: options.idempotencyKey ?? null,
      deadLetterReason: null,
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
    error: Error | string,
    options?: { terminal?: boolean }
  ): Promise<{ retrying: boolean; nextRunAt?: Date }> {
    const job = await this.storage.getJob(jobId);
    if (!job) {
      throw new Error(`Cannot fail non-existent job: ${jobId}`);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTerminal = options?.terminal || isTerminalJobError(error);
    const nextAttempts = job.attempts + 1;

    if (isTerminal) {
      await this.storage.updateJob(jobId, {
        status: 'DEAD_LETTER',
        attempts: nextAttempts,
        lastError: errorMessage,
        deadLetterReason: `Terminal error: ${errorMessage}`,
        lockedAt: null,
        lockedBy: null,
      });
      return { retrying: false };
    }

    if (nextAttempts >= job.maxAttempts) {
      await this.storage.updateJob(jobId, {
        status: 'DEAD_LETTER',
        attempts: nextAttempts,
        lastError: errorMessage,
        deadLetterReason: `Max attempts reached (${job.maxAttempts}): ${errorMessage}`,
        lockedAt: null,
        lockedBy: null,
      });
      return { retrying: false };
    }

    const policy = getJobRetryPolicy(job.name);
    const backoffMs = calculateBackoffWithJitter(
      nextAttempts,
      policy.baseDelayMs,
      policy.maxDelayMs
    );
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
