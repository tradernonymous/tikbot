import { describe, it, expect, beforeEach } from 'vitest';
import {
  WatchlistScheduler,
  type WatchlistTarget,
} from '../watchlist-scheduler';

describe('Watchlist Scheduler (Creator & Feed Polling)', () => {
  let scheduler: WatchlistScheduler;

  beforeEach(() => {
    scheduler = new WatchlistScheduler();
  });

  it('registers and retrieves active watchlist targets', () => {
    const target: WatchlistTarget = {
      id: 'wl-creator-1',
      type: 'CREATOR',
      identifier: 'charlidamelio',
      intervalHours: 12,
      enabled: true,
    };

    scheduler.addTarget(target);
    const retrieved = scheduler.getTarget('wl-creator-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.identifier).toBe('charlidamelio');
  });

  it('determines due targets whose nextPollAt is before current time', () => {
    const past = new Date(Date.now() - 3600 * 1000);
    const future = new Date(Date.now() + 3600 * 1000);

    scheduler.addTarget({
      id: 'due-1',
      type: 'CREATOR',
      identifier: 'viral_guru',
      intervalHours: 6,
      nextPollAt: past,
      enabled: true,
    });

    scheduler.addTarget({
      id: 'not-due',
      type: 'HASHTAG',
      identifier: 'saasgrowth',
      intervalHours: 24,
      nextPollAt: future,
      enabled: true,
    });

    const due = scheduler.getDueTargets();
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe('due-1');
  });

  it('updates next poll time and records poll success', () => {
    const target: WatchlistTarget = {
      id: 'wl-1',
      type: 'CREATOR',
      identifier: 'author_x',
      intervalHours: 8,
      enabled: true,
    };
    scheduler.addTarget(target);

    scheduler.recordPollSuccess('wl-1');
    const updated = scheduler.getTarget('wl-1');
    expect(updated?.lastPolledAt).toBeDefined();
    expect(updated?.consecutiveFailures).toBe(0);
    expect(updated?.nextPollAt?.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('increments consecutive failures on poll failure', () => {
    scheduler.addTarget({
      id: 'wl-err',
      type: 'CREATOR',
      identifier: 'banned_creator',
      intervalHours: 12,
      enabled: true,
    });

    scheduler.recordPollFailure('wl-err', 'HTTP 404 Creator Not Found');
    const updated = scheduler.getTarget('wl-err');
    expect(updated?.consecutiveFailures).toBe(1);
    expect(updated?.lastError).toContain('404');
  });
});
