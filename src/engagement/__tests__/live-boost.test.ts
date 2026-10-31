import { describe, it, expect, beforeEach } from 'vitest';
import { LiveBoostSessionManager, LiveBoostConfig } from '../live-boost';
import { KillSwitchManager } from '../../security/kill-switch';

describe('LiveBoostSessionManager', () => {
  let killSwitch: KillSwitchManager;
  let manager: LiveBoostSessionManager;

  beforeEach(() => {
    killSwitch = new KillSwitchManager();
    manager = new LiveBoostSessionManager({ killSwitch });
  });

  it('creates a live boost session in PENDING status with capped accounts', () => {
    const session = manager.createSession({
      liveUrl: 'https://www.tiktok.com/@streamer/live',
      accountIds: ['acc-1', 'acc-2', 'acc-3'],
      durationMinutes: 30,
      chatTemplates: ['Hello!', 'Awesome stream!', 'Nice!'],
    });

    expect(session.id).toBeDefined();
    expect(session.status).toBe('PENDING');
    expect(session.accountIds).toHaveLength(3);
    expect(session.durationMinutes).toBe(30);
  });

  it('rejects live boost session creation if accounts exceed safety cap', () => {
    const tooManyAccounts = Array.from({ length: 100 }, (_, i) => `acc-${i}`);
    expect(() => {
      manager.createSession({
        liveUrl: 'https://www.tiktok.com/@streamer/live',
        accountIds: tooManyAccounts,
        durationMinutes: 30,
      });
    }).toThrow(/Account pool exceeds maximum safety cap/);
  });

  it('generates staggered join and chat schedules for viewers', () => {
    const session = manager.createSession({
      liveUrl: 'https://www.tiktok.com/@streamer/live',
      accountIds: ['acc-1', 'acc-2'],
      durationMinutes: 15,
      chatTemplates: ['Nice!', 'Let is go!'],
    });

    const schedule = manager.generateViewerSchedule(session.id);
    expect(schedule).toHaveLength(2);
    expect(schedule[0].joinOffsetSec).toBeGreaterThanOrEqual(0);
    expect(schedule[1].joinOffsetSec).toBeGreaterThan(schedule[0].joinOffsetSec);
    expect(schedule[0].chatEvents.length).toBeGreaterThan(0);
  });

  it('terminates active session immediately if kill switch engaged', () => {
    const session = manager.createSession({
      liveUrl: 'https://www.tiktok.com/@streamer/live',
      accountIds: ['acc-1'],
      durationMinutes: 15,
    });
    manager.startSession(session.id);
    expect(manager.getSession(session.id)?.status).toBe('STREAMING');

    killSwitch.setKillSwitch(true, 'Live boost emergency stop');
    expect(() => manager.assertSessionCanRun(session.id)).toThrow(/Operational Kill Switch is ACTIVE/);
    
    // Auto-terminates session
    manager.emergencyHaltAll();
    expect(manager.getSession(session.id)?.status).toBe('TERMINATED');
  });
});
