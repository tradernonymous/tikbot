import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BanRateCircuitBreaker,
  CircuitBreakerTrippedError,
} from '../circuit-breaker';
import { globalNotificationService } from '@/notifications/service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    systemSetting: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/notifications/service', () => ({
  globalNotificationService: {
    emitIncident: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Ban-Rate Circuit Breaker & Safety Guardrails (R3.6)', () => {
  let circuitBreaker: BanRateCircuitBreaker;

  beforeEach(() => {
    vi.clearAllMocks();
    circuitBreaker = new BanRateCircuitBreaker({
      banThreshold: 3,
      windowMs: 10 * 60 * 1000, // 10 minutes
    });
  });

  it('remains closed when bans are below threshold', async () => {
    await circuitBreaker.recordBan('acc-1');
    await circuitBreaker.recordBan('acc-2');

    expect(circuitBreaker.isTripped()).toBe(false);
    expect(() => circuitBreaker.assertExecutionAllowed()).not.toThrow();
    expect(prisma.campaign.updateMany).not.toHaveBeenCalled();
    expect(globalNotificationService.emitIncident).not.toHaveBeenCalled();
  });

  it('trips circuit breaker, pauses campaigns, and emits incident notification on 3 bans in 10 minutes', async () => {
    await circuitBreaker.recordBan('acc-1');
    await circuitBreaker.recordBan('acc-2');
    await circuitBreaker.recordBan('acc-3');

    expect(circuitBreaker.isTripped()).toBe(true);
    expect(() => circuitBreaker.assertExecutionAllowed()).toThrow(CircuitBreakerTrippedError);

    // Assert active campaigns were paused
    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      data: { status: 'PAUSED' },
    });

    // Assert critical incident notification was emitted
    expect(globalNotificationService.emitIncident).toHaveBeenCalledWith(
      'CRITICAL',
      'CIRCUIT_BREAKER_TRIPPED',
      expect.stringContaining('Ban circuit breaker tripped: 3 bans in 10 minutes')
    );
  });

  it('ignores bans outside of the rolling time window', async () => {
    const oldTime = Date.now() - 11 * 60 * 1000; // 11 mins ago (outside 10 min window)
    await circuitBreaker.recordBan('acc-old-1', oldTime);
    await circuitBreaker.recordBan('acc-old-2', oldTime);

    // Only 1 ban in current window
    await circuitBreaker.recordBan('acc-fresh');

    expect(circuitBreaker.isTripped()).toBe(false);
    expect(() => circuitBreaker.assertExecutionAllowed()).not.toThrow();
  });

  it('allows manual reset of tripped circuit breaker', async () => {
    await circuitBreaker.recordBan('acc-1');
    await circuitBreaker.recordBan('acc-2');
    await circuitBreaker.recordBan('acc-3');
    expect(circuitBreaker.isTripped()).toBe(true);

    await circuitBreaker.reset();
    expect(circuitBreaker.isTripped()).toBe(false);
    expect(() => circuitBreaker.assertExecutionAllowed()).not.toThrow();
  });
});
