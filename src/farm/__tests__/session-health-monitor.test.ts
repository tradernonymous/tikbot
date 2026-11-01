import { describe, it, expect, beforeEach } from 'vitest';
import {
  SessionHealthMonitor,
  type AccountSessionCheckInput,
} from '../session-health-monitor';

describe('H5.5 Session Health Monitor & Re-auth Task Generator', () => {
  let monitor: SessionHealthMonitor;

  beforeEach(() => {
    monitor = new SessionHealthMonitor({
      staleAgeDays: 14,
      nearExpirySeconds: 86400, // 24 hours
    });
  });

  it('validates a fresh session with all required cookies', () => {
    const input: AccountSessionCheckInput = {
      accountId: 'acc-valid',
      platform: 'TIKTOK',
      capturedAt: new Date().toISOString(),
      cookies: [
        { name: 'sessionid', value: 'sess12345678', domain: '.tiktok.com', expires: Date.now() / 1000 + 604800 },
        { name: 'sid_guard', value: 'guard9876', domain: '.tiktok.com' },
      ],
    };

    const result = monitor.checkSessionHealth(input);
    expect(result.isValid).toBe(true);
    expect(result.needsReAuth).toBe(false);
    expect(result.reAuthTask).toBeUndefined();
  });

  it('flags missing critical session cookies and creates a re-auth task without failing the caller', () => {
    const input: AccountSessionCheckInput = {
      accountId: 'acc-missing-cookie',
      platform: 'TIKTOK',
      capturedAt: new Date().toISOString(),
      cookies: [
        { name: 'random_tracker', value: '123', domain: '.tiktok.com' },
      ],
    };

    const result = monitor.checkSessionHealth(input);
    expect(result.isValid).toBe(false);
    expect(result.needsReAuth).toBe(true);
    expect(result.reAuthTask).toBeDefined();
    expect(result.reAuthTask?.accountId).toBe('acc-missing-cookie');
    expect(result.reAuthTask?.reason).toBe('MISSING_CRITICAL_COOKIE');
    expect(result.reAuthTask?.status).toBe('PENDING_OPERATOR');
  });

  it('flags expired session cookies and generates high priority re-auth task', () => {
    const input: AccountSessionCheckInput = {
      accountId: 'acc-expired',
      platform: 'TIKTOK',
      capturedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      cookies: [
        { name: 'sessionid', value: 'old', domain: '.tiktok.com', expires: Date.now() / 1000 - 3600 },
      ],
    };

    const result = monitor.checkSessionHealth(input);
    expect(result.isValid).toBe(false);
    expect(result.needsReAuth).toBe(true);
    expect(result.reAuthTask?.reason).toBe('SESSION_EXPIRED');
  });

  it('flags stale sessions older than staleAgeDays even if cookies technically unexpired', () => {
    const input: AccountSessionCheckInput = {
      accountId: 'acc-stale',
      platform: 'TIKTOK',
      capturedAt: new Date(Date.now() - 86400000 * 16).toISOString(), // 16 days old > 14
      cookies: [
        { name: 'sessionid', value: 'fresh-val', domain: '.tiktok.com', expires: Date.now() / 1000 + 500000 },
      ],
    };

    const result = monitor.checkSessionHealth(input);
    expect(result.isValid).toBe(false);
    expect(result.needsReAuth).toBe(true);
    expect(result.reAuthTask?.reason).toBe('SESSION_STALE');
  });
});
