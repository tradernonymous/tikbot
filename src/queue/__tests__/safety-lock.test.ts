import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueSafetyLockManager } from '../safety-lock';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Queue Safety Lock Manager (B4 TDD)', () => {
  let lockManager: QueueSafetyLockManager;

  beforeEach(() => {
    vi.clearAllMocks();
    lockManager = new QueueSafetyLockManager({ ttlMs: 10000 });
  });

  it('acquires lock for an account when not locked', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

    const acquired = await lockManager.acquireAccountLock('acc-lock-1', 'worker-1');
    expect(acquired).toBe(true);
    expect(prisma.systemSetting.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects lock acquisition if another worker already holds an active lock', async () => {
    const expiresAt = new Date(Date.now() + 5000).toISOString();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:acc-lock-2',
      value: JSON.stringify({ workerId: 'worker-other', expiresAt }),
      updatedAt: new Date(),
    });

    const acquired = await lockManager.acquireAccountLock('acc-lock-2', 'worker-my');
    expect(acquired).toBe(false);
  });

  it('acquires lock if existing lock has expired (worker crash recovery)', async () => {
    const expiredAt = new Date(Date.now() - 5000).toISOString();
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:acc-lock-3',
      value: JSON.stringify({ workerId: 'dead-worker', expiresAt: expiredAt }),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

    const acquired = await lockManager.acquireAccountLock('acc-lock-3', 'worker-new');
    expect(acquired).toBe(true);
  });

  it('releases lock held by the owning worker', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:acc-lock-4',
      value: JSON.stringify({
        workerId: 'worker-1',
        expiresAt: new Date(Date.now() + 5000).toISOString(),
      }),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.systemSetting.delete).mockResolvedValue({} as any);

    const released = await lockManager.releaseAccountLock('acc-lock-4', 'worker-1');
    expect(released).toBe(true);
    expect(prisma.systemSetting.delete).toHaveBeenCalledWith({
      where: { key: 'LOCK:ACCOUNT:acc-lock-4' },
    });
  });

  it('does not release lock held by a different worker', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:acc-lock-5',
      value: JSON.stringify({
        workerId: 'worker-owner',
        expiresAt: new Date(Date.now() + 5000).toISOString(),
      }),
      updatedAt: new Date(),
    });

    const released = await lockManager.releaseAccountLock('acc-lock-5', 'worker-imposter');
    expect(released).toBe(false);
    expect(prisma.systemSetting.delete).not.toHaveBeenCalled();
  });

  it('checks if an account is locked via isAccountLocked', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:acc-check',
      value: JSON.stringify({
        workerId: 'worker-1',
        expiresAt: new Date(Date.now() + 5000).toISOString(),
      }),
      updatedAt: new Date(),
    });

    const isLocked = await lockManager.isAccountLocked('acc-check');
    expect(isLocked).toBe(true);

    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    const isUnlocked = await lockManager.isAccountLocked('acc-check');
    expect(isUnlocked).toBe(false);
  });

  it('falls back to in-memory locking when database throws errors', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockRejectedValue(new Error('DB unreachable'));
    vi.mocked(prisma.systemSetting.upsert).mockRejectedValue(new Error('DB unreachable'));

    const acquired = await lockManager.acquireAccountLock('acc-mem', 'worker-mem-1');
    expect(acquired).toBe(true);

    const locked = await lockManager.isAccountLocked('acc-mem');
    expect(locked).toBe(true);

    // Another worker tries to acquire same in-memory lock
    const secondAcquired = await lockManager.acquireAccountLock('acc-mem', 'worker-mem-2');
    expect(secondAcquired).toBe(false);

    // Imposter fails to release
    const imposterRelease = await lockManager.releaseAccountLock('acc-mem', 'worker-imposter');
    expect(imposterRelease).toBe(false);

    // Owner releases
    const ownerRelease = await lockManager.releaseAccountLock('acc-mem', 'worker-mem-1');
    expect(ownerRelease).toBe(true);
  });

  it('handles corrupted lock JSON gracefully and overwrites', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LOCK:ACCOUNT:corrupt',
      value: '{ broken json @@',
      updatedAt: new Date(),
    });
    vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

    const acquired = await lockManager.acquireAccountLock('corrupt', 'worker-fix');
    expect(acquired).toBe(true);
  });
});
