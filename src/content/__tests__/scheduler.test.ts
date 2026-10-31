import { describe, it, expect, beforeEach } from 'vitest';
import { ContentScheduler, ScheduleItemInput } from '../scheduler';
import { KillSwitchManager } from '../../security/kill-switch';

describe('ContentScheduler', () => {
  let killSwitch: KillSwitchManager;
  let scheduler: ContentScheduler;

  beforeEach(() => {
    killSwitch = new KillSwitchManager();
    scheduler = new ContentScheduler({ killSwitch });
  });

  it('schedules a post in PENDING_APPROVAL status by default', () => {
    const postDate = new Date('2026-11-01T18:00:00Z');
    const item = scheduler.schedulePost({
      mediaAssetId: 'asset-123',
      caption: 'Top productivity hacks',
      platform: 'TIKTOK',
      scheduledAt: postDate,
      accountId: 'acc-farm-1',
    });

    expect(item.id).toBeDefined();
    expect(item.status).toBe('PENDING_APPROVAL');
    expect(item.scheduledAt).toEqual(postDate);
  });

  it('approves a scheduled post and transitions it to SCHEDULED', () => {
    const item = scheduler.schedulePost({
      mediaAssetId: 'asset-123',
      caption: 'Top productivity hacks',
      platform: 'TIKTOK',
      scheduledAt: new Date('2026-11-01T18:00:00Z'),
      accountId: 'acc-farm-1',
    });

    const approved = scheduler.approveScheduleItem(item.id, 'admin-operator');
    expect(approved.status).toBe('SCHEDULED');
    expect(approved.approvedBy).toBe('admin-operator');
  });

  it('generates recurring calendar slots for evergreen content rotation', () => {
    const baseTime = new Date('2026-11-01T08:00:00Z');
    const slots = scheduler.generateRecurringSlots({
      startDate: baseTime,
      intervalHours: 6,
      count: 4,
    });

    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual(new Date('2026-11-01T08:00:00Z'));
    expect(slots[1]).toEqual(new Date('2026-11-01T14:00:00Z'));
    expect(slots[2]).toEqual(new Date('2026-11-01T20:00:00Z'));
    expect(slots[3]).toEqual(new Date('2026-11-02T02:00:00Z'));
  });

  it('handles publishing retries with backoff and fails when max retries exceeded', () => {
    const item = scheduler.schedulePost({
      mediaAssetId: 'asset-123',
      caption: 'Top productivity hacks',
      platform: 'TIKTOK',
      scheduledAt: new Date('2026-11-01T18:00:00Z'),
      accountId: 'acc-farm-1',
    });
    scheduler.approveScheduleItem(item.id, 'admin-operator');

    // 1st retry
    const retry1 = scheduler.recordPublishFailure(item.id, 'Network timeout');
    expect(retry1.retryCount).toBe(1);
    expect(retry1.status).toBe('RETRYING');
    expect(retry1.nextRetryAt?.getTime()).toBeGreaterThan(Date.now());

    // 2nd retry
    scheduler.recordPublishFailure(item.id, 'Network timeout');
    // 3rd failure exceeds max retries (default: 3)
    const finalFailure = scheduler.recordPublishFailure(item.id, 'Fatal error');
    expect(finalFailure.retryCount).toBe(3);
    expect(finalFailure.status).toBe('FAILED');
    expect(finalFailure.lastError).toBe('Fatal error');
  });

  it('blocks dispatch when kill switch is active', () => {
    killSwitch.setKillSwitch(true, 'Publishing paused for audit');
    expect(() => {
      scheduler.assertCanPublish();
    }).toThrow(/Operational Kill Switch is ACTIVE/);
  });
});
