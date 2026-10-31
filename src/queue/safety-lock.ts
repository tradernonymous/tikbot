export interface SafetyLockOptions {
  ttlMs?: number;
}

export interface LockPayload {
  workerId: string;
  expiresAt: string;
}

export class QueueSafetyLockManager {
  private ttlMs: number;
  private localLocks = new Map<string, LockPayload>();

  constructor(options: SafetyLockOptions = {}) {
    this.ttlMs = options.ttlMs ?? 60000; // 60 seconds default
  }

  private lockKey(accountId: string): string {
    return `LOCK:ACCOUNT:${accountId}`;
  }

  async acquireAccountLock(accountId: string, workerId: string, ttlOverrideMs?: number): Promise<boolean> {
    const key = this.lockKey(accountId);
    const ttl = ttlOverrideMs ?? this.ttlMs;
    const now = Date.now();
    const expiresAt = new Date(now + ttl).toISOString();
    const payload: LockPayload = { workerId, expiresAt };

    try {
      const { prisma } = await import('@/lib/prisma');
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (existing?.value) {
        try {
          const parsed: LockPayload = JSON.parse(existing.value);
          const expiryTime = new Date(parsed.expiresAt).getTime();
          if (expiryTime > now && parsed.workerId !== workerId) {
            // Lock active and owned by another worker
            return false;
          }
        } catch {
          // Corrupted lock, overwrite
        }
      }

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(payload) },
        create: { key, value: JSON.stringify(payload) },
      });

      this.localLocks.set(key, payload);
      return true;
    } catch {
      // In-memory fallback
      const local = this.localLocks.get(key);
      if (local) {
        const expiry = new Date(local.expiresAt).getTime();
        if (expiry > now && local.workerId !== workerId) {
          return false;
        }
      }
      this.localLocks.set(key, payload);
      return true;
    }
  }

  async releaseAccountLock(accountId: string, workerId: string): Promise<boolean> {
    const key = this.lockKey(accountId);

    try {
      const { prisma } = await import('@/lib/prisma');
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!existing?.value) {
        this.localLocks.delete(key);
        return true;
      }

      try {
        const parsed: LockPayload = JSON.parse(existing.value);
        if (parsed.workerId !== workerId) {
          return false; // Not lock owner
        }
      } catch {
        // Corrupted, allow delete
      }

      await prisma.systemSetting.delete({
        where: { key },
      });

      this.localLocks.delete(key);
      return true;
    } catch {
      const local = this.localLocks.get(key);
      if (local && local.workerId !== workerId) {
        return false;
      }
      this.localLocks.delete(key);
      return true;
    }
  }

  async isAccountLocked(accountId: string): Promise<boolean> {
    const key = this.lockKey(accountId);
    const now = Date.now();

    try {
      const { prisma } = await import('@/lib/prisma');
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (existing?.value) {
        const parsed: LockPayload = JSON.parse(existing.value);
        return new Date(parsed.expiresAt).getTime() > now;
      }
    } catch {
      const local = this.localLocks.get(key);
      if (local) {
        return new Date(local.expiresAt).getTime() > now;
      }
    }

    return false;
  }
}

export const globalQueueSafetyLock = new QueueSafetyLockManager();
