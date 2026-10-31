import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  resetLoginRateLimiter,
} from '../login-rate-limiter';

describe('Login Rate Limiter (S9)', () => {
  beforeEach(() => {
    resetLoginRateLimiter();
    vi.useRealTimers();
  });

  it('allows up to 5 attempts per IP per minute', () => {
    const ip = '192.168.1.100';
    for (let i = 0; i < 5; i++) {
      const check = checkLoginRateLimit(ip);
      expect(check.allowed).toBe(true);
      recordLoginFailure(ip);
    }

    // 6th attempt should be blocked
    const sixth = checkLoginRateLimit(ip);
    expect(sixth.allowed).toBe(false);
    expect(sixth.status).toBe(429);
    expect(sixth.reason).toContain('Too many login attempts');
  });

  it('triggers a 15-minute lockout after 10 consecutive failures', () => {
    vi.useFakeTimers();
    const ip = '10.0.0.5';

    // 5 attempts in first minute
    for (let i = 0; i < 5; i++) {
      expect(checkLoginRateLimit(ip).allowed).toBe(true);
      recordLoginFailure(ip);
    }
    expect(checkLoginRateLimit(ip).allowed).toBe(false);

    // Advance 61 seconds so window resets, but consecutive failures remain 5
    vi.advanceTimersByTime(61 * 1000);
    for (let i = 0; i < 5; i++) {
      expect(checkLoginRateLimit(ip).allowed).toBe(true);
      recordLoginFailure(ip);
    }
    // Now consecutive failures = 10 -> triggers 15 min lockout!
    const locked = checkLoginRateLimit(ip);
    expect(locked.allowed).toBe(false);
    expect(locked.status).toBe(429);
    expect(locked.reason).toContain('15 minutes');

    // Advance 14 minutes -> still locked
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(checkLoginRateLimit(ip).allowed).toBe(false);

    // Advance past 15 minutes -> unlocked
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(checkLoginRateLimit(ip).allowed).toBe(true);
  });

  it('resets consecutive failures on successful login', () => {
    const ip = '172.16.0.2';
    for (let i = 0; i < 4; i++) {
      recordLoginFailure(ip);
    }
    recordLoginSuccess(ip);
    // Failure counter reset
    expect(checkLoginRateLimit(ip).allowed).toBe(true);
  });
});
