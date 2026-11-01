import { describe, it, expect, beforeEach } from 'vitest';
import {
  WarmupScheduler,
  type WarmupActionType,
  WarmupGateError,
} from '../warmup-scheduler';

describe('H5.4 Warmup Scheduler & Action Gating', () => {
  let scheduler: WarmupScheduler;

  beforeEach(() => {
    scheduler = new WarmupScheduler();
  });

  it('allows views on Day 1 but strictly blocks likes and comments', () => {
    const viewCheck = scheduler.checkActionAllowed({
      accountId: 'acc-newbie',
      warmupDay: 1,
      actionType: 'VIEW',
      currentDayCounts: { VIEW: 5, LIKE: 0, FOLLOW: 0, COMMENT: 0 },
    });
    expect(viewCheck.allowed).toBe(true);

    const likeCheck = scheduler.checkActionAllowed({
      accountId: 'acc-newbie',
      warmupDay: 1,
      actionType: 'LIKE',
      currentDayCounts: { VIEW: 5, LIKE: 0, FOLLOW: 0, COMMENT: 0 },
    });
    expect(likeCheck.allowed).toBe(false);
    expect(likeCheck.reason).toContain('not permitted on warmup day 1');

    const commentCheck = scheduler.checkActionAllowed({
      accountId: 'acc-newbie',
      warmupDay: 1,
      actionType: 'COMMENT',
      currentDayCounts: { VIEW: 5, LIKE: 0, FOLLOW: 0, COMMENT: 0 },
    });
    expect(commentCheck.allowed).toBe(false);
  });

  it('allows likes starting Day 3, but still blocks comments until Day 5', () => {
    const likeCheck = scheduler.checkActionAllowed({
      accountId: 'acc-day3',
      warmupDay: 3,
      actionType: 'LIKE',
      currentDayCounts: { VIEW: 10, LIKE: 2, FOLLOW: 1, COMMENT: 0 },
    });
    expect(likeCheck.allowed).toBe(true);

    const commentCheck = scheduler.checkActionAllowed({
      accountId: 'acc-day3',
      warmupDay: 3,
      actionType: 'COMMENT',
      currentDayCounts: { VIEW: 10, LIKE: 2, FOLLOW: 1, COMMENT: 0 },
    });
    expect(commentCheck.allowed).toBe(false);
    expect(commentCheck.reason).toContain('COMMENT');
  });

  it('enforces daily quotas for current warmup day and rejects excess actions', () => {
    // Day 3 allows max 5 likes
    const quotaExceededCheck = scheduler.checkActionAllowed({
      accountId: 'acc-day3',
      warmupDay: 3,
      actionType: 'LIKE',
      currentDayCounts: { VIEW: 20, LIKE: 5, FOLLOW: 1, COMMENT: 0 },
    });
    expect(quotaExceededCheck.allowed).toBe(false);
    expect(quotaExceededCheck.reason).toContain('Daily limit reached');
  });

  it('assertActionAllowed throws WarmupGateError when check fails', () => {
    expect(() => {
      scheduler.assertActionAllowed({
        accountId: 'acc-day1',
        warmupDay: 1,
        actionType: 'COMMENT',
        currentDayCounts: { VIEW: 2, LIKE: 0, FOLLOW: 0, COMMENT: 0 },
      });
    }).toThrow(WarmupGateError);
  });

  it('allows all standard farm actions when account is graduated (day >= 7 or graduated flag)', () => {
    const graduatedCheck = scheduler.checkActionAllowed({
      accountId: 'acc-vet',
      warmupDay: 8,
      graduated: true,
      actionType: 'COMMENT',
      currentDayCounts: { VIEW: 100, LIKE: 20, FOLLOW: 5, COMMENT: 10 },
    });
    expect(graduatedCheck.allowed).toBe(true);
  });
});
