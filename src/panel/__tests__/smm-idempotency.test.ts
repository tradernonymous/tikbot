import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SMMIdempotencyManager } from '../smm-idempotency';

describe('SMM Order Idempotency & Deduplication (P9 TDD)', () => {
  let manager: SMMIdempotencyManager;

  beforeEach(() => {
    manager = new SMMIdempotencyManager({ windowMs: 5000 }); // 5s test window
  });

  it('generates consistent dedupe keys from campaignId, service, link, and quantity', () => {
    const key1 = manager.generateKey({
      campaignId: 'camp-100',
      service: '12',
      link: 'https://tiktok.com/@u/video/1',
      quantity: 1000,
    });

    const key2 = manager.generateKey({
      campaignId: 'camp-100',
      service: 12 as any,
      link: 'https://tiktok.com/@u/video/1',
      quantity: 1000,
    });

    expect(key1).toBe(key2);
    expect(key1).toContain('camp-100');
    expect(key1).toContain('12');
  });

  it('acquires lock on first submission and records success', async () => {
    const key = 'dedupe-test-1';
    const check1 = await manager.checkAndLock(key);
    expect(check1.isDuplicate).toBe(false);
    expect(check1.lockAcquired).toBe(true);

    await manager.recordSuccess(key, { orderId: 'ext-999', status: 'SUCCESS' });

    // Second submission with same key returns cached result without double charging
    const check2 = await manager.checkAndLock(key);
    expect(check2.isDuplicate).toBe(true);
    expect(check2.existingResult).toEqual({ orderId: 'ext-999', status: 'SUCCESS' });
  });

  it('prevents concurrent double submission while lock is acquired', async () => {
    const key = 'concurrent-test';
    const firstLock = await manager.checkAndLock(key);
    expect(firstLock.lockAcquired).toBe(true);

    // Second lock attempt while first is still pending
    const secondLock = await manager.checkAndLock(key);
    expect(secondLock.lockAcquired).toBe(false);
    expect(secondLock.isDuplicate).toBe(false);
    expect(secondLock.inFlight).toBe(true);
  });

  it('releases lock if order creation fails so user can retry', async () => {
    const key = 'fail-test';
    const lock = await manager.checkAndLock(key);
    expect(lock.lockAcquired).toBe(true);

    // Order failed, release lock
    await manager.releaseLock(key);

    // Can acquire lock again
    const retryLock = await manager.checkAndLock(key);
    expect(retryLock.lockAcquired).toBe(true);
  });

  it('expires idempotency entry after time window', async () => {
    const key = 'expire-test';
    await manager.checkAndLock(key);
    await manager.recordSuccess(key, { orderId: 'ext-old' });

    // Fast-forward past windowMs
    const futureTime = Date.now() + 6000;
    const checkExpired = await manager.checkAndLock(key, futureTime);
    expect(checkExpired.isDuplicate).toBe(false);
    expect(checkExpired.lockAcquired).toBe(true);
  });
});
