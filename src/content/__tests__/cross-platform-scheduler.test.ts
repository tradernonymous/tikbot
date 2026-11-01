import { describe, it, expect, beforeEach } from 'vitest';
import {
  CrossPlatformScheduler,
  type ScheduledPostEntry,
  type TargetPlatform,
} from '../cross-platform-scheduler';

describe('M6.3 Cross-Platform Calendar Scheduler', () => {
  let scheduler: CrossPlatformScheduler;

  beforeEach(() => {
    scheduler = new CrossPlatformScheduler({
      dailyCaps: {
        TIKTOK: 4,
        YOUTUBE_SHORTS: 3,
        INSTAGRAM_REELS: 2,
      },
      minSlotIntervalMinutes: 30,
    });
  });

  it('allows scheduling within daily caps and safe time window', () => {
    const existingPosts: ScheduledPostEntry[] = [
      {
        id: 'post-1',
        accountId: 'acc-multi',
        platform: 'TIKTOK',
        scheduledFor: new Date('2026-11-05T10:00:00Z'),
      },
    ];

    const result = scheduler.validateScheduleSlot({
      accountId: 'acc-multi',
      platform: 'YOUTUBE_SHORTS',
      requestedTime: new Date('2026-11-05T12:00:00Z'),
      existingPosts,
    });

    expect(result.allowed).toBe(true);
    expect(result.conflictDetected).toBe(false);
  });

  it('rejects post when platform daily cap is exceeded', () => {
    const existingPosts: ScheduledPostEntry[] = [
      { id: 'ig-1', accountId: 'acc-multi', platform: 'INSTAGRAM_REELS', scheduledFor: new Date('2026-11-05T09:00:00Z') },
      { id: 'ig-2', accountId: 'acc-multi', platform: 'INSTAGRAM_REELS', scheduledFor: new Date('2026-11-05T15:00:00Z') },
    ];

    // Cap is 2 for INSTAGRAM_REELS
    const result = scheduler.validateScheduleSlot({
      accountId: 'acc-multi',
      platform: 'INSTAGRAM_REELS',
      requestedTime: new Date('2026-11-05T18:00:00Z'),
      existingPosts,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Daily cap reached for INSTAGRAM_REELS (2/2)');
  });

  it('flags conflict when new post is too close to another post on same account', () => {
    const existingPosts: ScheduledPostEntry[] = [
      { id: 'p-1', accountId: 'acc-multi', platform: 'TIKTOK', scheduledFor: new Date('2026-11-05T14:00:00Z') },
    ];

    // 15 minutes later is within minSlotIntervalMinutes (30)
    const result = scheduler.validateScheduleSlot({
      accountId: 'acc-multi',
      platform: 'YOUTUBE_SHORTS',
      requestedTime: new Date('2026-11-05T14:15:00Z'),
      existingPosts,
    });

    expect(result.allowed).toBe(false);
    expect(result.conflictDetected).toBe(true);
    expect(result.reason).toContain('Conflict: minimum 30 min spacing required');
  });

  it('suggests next available valid slot when conflict or default time is given', () => {
    const existingPosts: ScheduledPostEntry[] = [
      { id: 'p-1', accountId: 'acc-multi', platform: 'TIKTOK', scheduledFor: new Date('2026-11-05T14:00:00Z') },
    ];

    const nextSlot = scheduler.findNextAvailableSlot({
      accountId: 'acc-multi',
      platform: 'TIKTOK',
      baseTime: new Date('2026-11-05T14:00:00Z'),
      existingPosts,
    });

    expect(nextSlot.getTime()).toBeGreaterThanOrEqual(new Date('2026-11-05T14:30:00Z').getTime());
  });
});
