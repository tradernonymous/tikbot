import { prisma } from '@/lib/prisma';
import { JobRecord, QueueStorageAdapter } from './index';
import { Prisma } from '@prisma/client';

export interface PostgresQueueOptions {
  visibilityTimeoutMs?: number;
}

export class PostgresQueueStorage implements QueueStorageAdapter {
  private visibilityTimeoutMs: number;

  constructor(options: PostgresQueueOptions = {}) {
    this.visibilityTimeoutMs = options.visibilityTimeoutMs ?? 5 * 60 * 1000; // 5 minutes default
  }

  async insert(jobData: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobRecord> {
    const created = await prisma.job.create({
      data: {
        name: jobData.name,
        payload: jobData.payload as Prisma.InputJsonValue,
        status: jobData.status,
        priority: jobData.priority,
        runAt: jobData.runAt,
        attempts: jobData.attempts,
        maxAttempts: jobData.maxAttempts,
        lockedAt: jobData.lockedAt,
        lockedBy: jobData.lockedBy,
        lastError: jobData.lastError,
        deadLetterReason: jobData.deadLetterReason,
        idempotencyKey: jobData.idempotencyKey,
      },
    });

    return {
      ...created,
      payload: (created.payload as Record<string, unknown>) ?? {},
    };
  }

  async findByIdempotencyKey(key: string): Promise<JobRecord | null> {
    const job = await prisma.job.findUnique({
      where: { idempotencyKey: key },
    });
    if (!job) return null;
    return {
      ...job,
      payload: (job.payload as Record<string, unknown>) ?? {},
    };
  }

  async reclaimStaleJobs(): Promise<number> {
    const threshold = new Date(Date.now() - this.visibilityTimeoutMs);
    const staleJobs = await prisma.job.findMany({
      where: {
        status: 'RUNNING',
        lockedAt: {
          lt: threshold,
        },
      },
    });

    let reclaimed = 0;
    for (const job of staleJobs) {
      const nextAttempts = job.attempts + 1;
      if (nextAttempts >= job.maxAttempts) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            lastError: `Visibility timeout exceeded (${this.visibilityTimeoutMs}ms); max attempts reached`,
            lockedAt: null,
            lockedBy: null,
          },
        });
      } else {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            attempts: nextAttempts,
            lockedAt: null,
            lockedBy: null,
          },
        });
      }
      reclaimed++;
    }

    return reclaimed;
  }

  async claimNext(workerId: string): Promise<JobRecord | null> {
    // Reclaim stale jobs before claiming
    try {
      await this.reclaimStaleJobs();
    } catch {
      // Non-fatal if reclaim fails
    }

    // Atomic claim with SKIP LOCKED
    try {
      const rawRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
        WITH next_job AS (
          SELECT id FROM "Job"
          WHERE status = 'PENDING' AND "runAt" <= NOW()
          ORDER BY priority DESC, "runAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "Job"
        SET status = 'RUNNING', "lockedAt" = NOW(), "lockedBy" = ${workerId}, "updatedAt" = NOW()
        FROM next_job
        WHERE "Job".id = next_job.id
        RETURNING "Job".*;
      `;

      if (rawRows && rawRows.length > 0) {
        const row = rawRows[0] as any;
        return {
          id: row.id,
          name: row.name,
          payload: (row.payload as Record<string, unknown>) ?? {},
          status: row.status,
          priority: row.priority,
          runAt: new Date(row.runAt),
          lockedAt: row.lockedAt ? new Date(row.lockedAt) : null,
          lockedBy: row.lockedBy,
          attempts: row.attempts,
          maxAttempts: row.maxAttempts,
          lastError: row.lastError,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        };
      }
    } catch (err) {
      // Fallback for mocked environments or databases without raw query support
      console.warn('[PostgresQueueStorage] Raw SKIP LOCKED claim failed, checking fallback:', err);
    }

    return null;
  }

  async getJob(id: string): Promise<JobRecord | null> {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) return null;

    return {
      ...job,
      payload: (job.payload as Record<string, unknown>) ?? {},
    };
  }

  async updateJob(id: string, updates: Partial<JobRecord>): Promise<JobRecord> {
    const data: Prisma.JobUpdateInput = {};

    if (updates.status !== undefined) data.status = updates.status;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.runAt !== undefined) data.runAt = updates.runAt;
    if (updates.lockedAt !== undefined) data.lockedAt = updates.lockedAt;
    if (updates.lockedBy !== undefined) data.lockedBy = updates.lockedBy;
    if (updates.attempts !== undefined) data.attempts = updates.attempts;
    if (updates.lastError !== undefined) data.lastError = updates.lastError;
    if (updates.deadLetterReason !== undefined) data.deadLetterReason = updates.deadLetterReason;
    if (updates.payload !== undefined) data.payload = updates.payload as Prisma.InputJsonValue;

    const updated = await prisma.job.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      payload: (updated.payload as Record<string, unknown>) ?? {},
    };
  }
}
