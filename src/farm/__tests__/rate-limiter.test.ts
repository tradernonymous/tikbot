import { describe, it, expect, beforeEach } from 'vitest';
import {
  AccountRateLimiter,
  calculateHumanJitterDelay,
} from '../rate-limiter';

describe('Account Rate Limiter & Velocity Enforcer', () => {
  let limiter: AccountRateLimiter;

  beforeEach(() => {
    limiter = new AccountRateLimiter();
  });

  it('allows actions within hourly and daily velocity caps', () => {
    const check1 = limiter.canPerformAction('acc-1', 'LIKE');
    expect(check1.allowed).toBe(true);

    limiter.recordAction('acc-1', 'LIKE');
    const check2 = limiter.canPerformAction('acc-1', 'LIKE');
    expect(check2.allowed).toBe(true);
  });

  it('blocks actions and enforces hourly cap (e.g. 5 likes per hour)', () => {
    for (let i = 0; i < 5; i++) {
      expect(limiter.canPerformAction('acc-1', 'LIKE').allowed).toBe(true);
      limiter.recordAction('acc-1', 'LIKE');
    }

    // 6th action in same hour must be blocked
    const checkBlocked = limiter.canPerformAction('acc-1', 'LIKE');
    expect(checkBlocked.allowed).toBe(false);
    expect(checkBlocked.reason).toContain('Hourly cap exceeded');
  });

  it('blocks actions when daily cap is reached', () => {
    const now = Date.now();
    // Record 2 comments per hour over the last 6 hours (total 12 comments today, but <=2 per hour)
    for (let h = 6; h >= 1; h--) {
      const hourTimestamp = now - h * 60 * 60 * 1000 + 1000;
      limiter.recordAction('acc-2', 'COMMENT', hourTimestamp);
      limiter.recordAction('acc-2', 'COMMENT', hourTimestamp + 1000);
    }

    const checkBlocked = limiter.canPerformAction('acc-2', 'COMMENT', now);
    expect(checkBlocked.allowed).toBe(false);
    expect(checkBlocked.reason).toContain('Daily cap exceeded');
  });

  it('generates randomized human jitter delay within compliance boundaries', () => {
    for (let i = 0; i < 20; i++) {
      const delayMs = calculateHumanJitterDelay('VIEW');
      expect(delayMs).toBeGreaterThanOrEqual(15000);
      expect(delayMs).toBeLessThanOrEqual(45000);
    }
  });

  it('resets account action tracking cleanly', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAction('acc-1', 'LIKE');
    }
    expect(limiter.canPerformAction('acc-1', 'LIKE').allowed).toBe(false);

    limiter.resetAccount('acc-1');
    expect(limiter.canPerformAction('acc-1', 'LIKE').allowed).toBe(true);
  });
});
