import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionOrchestrator } from '../orchestrator';
import { AccountRateLimiter } from '../../farm/rate-limiter';
import { KillSwitchManager } from '../../security/kill-switch';

describe('ActionOrchestrator', () => {
  let rateLimiter: AccountRateLimiter;
  let killSwitch: KillSwitchManager;
  let orchestrator: ActionOrchestrator;

  beforeEach(() => {
    rateLimiter = new AccountRateLimiter();
    killSwitch = new KillSwitchManager();
    orchestrator = new ActionOrchestrator({
      rateLimiter,
      killSwitch,
      workingHours: { startHour: 8, endHour: 23 },
    });
  });

  it('rejects action dispatch if global kill switch is active', () => {
    killSwitch.setKillSwitch(true, 'Emergency halt triggered');
    expect(() => {
      orchestrator.dispatchAction({
        accountId: 'acc-1',
        actionType: 'LIKE',
        targetUrl: 'https://www.tiktok.com/@user/video/12345',
      });
    }).toThrow(/Operational Kill Switch is ACTIVE/);
  });

  it('detects if current time is within working hours', () => {
    const morning = new Date('2026-10-31T10:00:00Z');
    const midnight = new Date('2026-10-31T03:00:00Z');

    expect(orchestrator.isWithinWorkingHours(morning)).toBe(true);
    expect(orchestrator.isWithinWorkingHours(midnight)).toBe(false);

    // Test overnight window: 22:00 to 06:00
    const overnightOrch = new ActionOrchestrator({
      workingHours: { startHour: 22, endHour: 6 },
    });
    expect(overnightOrch.isWithinWorkingHours(new Date('2026-10-31T23:00:00Z'))).toBe(true);
    expect(overnightOrch.isWithinWorkingHours(new Date('2026-10-31T04:00:00Z'))).toBe(true);
    expect(overnightOrch.isWithinWorkingHours(new Date('2026-10-31T12:00:00Z'))).toBe(false);
  });

  it('refuses action execution outside working hours unless forced', () => {
    const midnight = new Date('2026-10-31T03:00:00Z');
    expect(() => {
      orchestrator.dispatchAction({
        accountId: 'acc-1',
        actionType: 'LIKE',
        targetUrl: 'https://www.tiktok.com/@user/video/12345',
        timestamp: midnight,
      });
    }).toThrow(/Outside working hours/);
  });

  it('enforces rate limits per account through the rate limiter', () => {
    const validTime = new Date('2026-10-31T12:00:00Z');
    // Exhaust comment limit (3 per hour)
    for (let i = 0; i < 3; i++) {
      const res = orchestrator.dispatchAction({
        accountId: 'acc-1',
        actionType: 'COMMENT',
        targetUrl: 'https://www.tiktok.com/@user/video/12345',
        timestamp: validTime,
      });
      expect(res.allowed).toBe(true);
    }

    expect(() => {
      orchestrator.dispatchAction({
        accountId: 'acc-1',
        actionType: 'COMMENT',
        targetUrl: 'https://www.tiktok.com/@user/video/12345',
        timestamp: validTime,
      });
    }).toThrow(/Hourly cap exceeded for COMMENT/);
  });

  it('builds a staggered action schedule across multiple farm accounts', () => {
    const baseTime = new Date('2026-10-31T14:00:00Z');
    const schedule = orchestrator.buildStaggeredSchedule({
      accountIds: ['acc-1', 'acc-2', 'acc-3'],
      actionType: 'LIKE',
      targetUrl: 'https://www.tiktok.com/@creator/video/999',
      baseTime,
      minIntervalMs: 10_000,
      maxIntervalMs: 20_000,
    });

    expect(schedule).toHaveLength(3);
    expect(schedule[0].accountId).toBe('acc-1');
    expect(schedule[0].scheduledFor.getTime()).toBeGreaterThanOrEqual(baseTime.getTime());
    expect(schedule[1].scheduledFor.getTime()).toBeGreaterThan(schedule[0].scheduledFor.getTime());
    expect(schedule[2].scheduledFor.getTime()).toBeGreaterThan(schedule[1].scheduledFor.getTime());
  });
});
