import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentPublisher, PublishRequest } from '../publisher';
import { KillSwitchManager } from '../../security/kill-switch';

describe('ContentPublisher', () => {
  let killSwitch: KillSwitchManager;
  let publisher: ContentPublisher;

  beforeEach(() => {
    killSwitch = new KillSwitchManager();
    const mockDriver = vi.fn().mockResolvedValue({
      success: true,
      publishedVideoId: 'vid-test-123',
      url: 'https://tiktok.com/@creator/video/vid-test-123',
    });
    publisher = new ContentPublisher({ killSwitch, uploaderDriver: mockDriver });
  });

  it('fails upload if account session is missing or invalid', async () => {
    await expect(
      publisher.publishVideo({
        accountId: 'acc-empty',
        mediaPath: '/tmp/sample.mp4',
        caption: 'Test video',
        hasValidSession: false,
      })
    ).rejects.toThrow(/Account acc-empty does not have an active authenticated session/);
  });

  it('aborts upload if kill switch is activated', async () => {
    killSwitch.setKillSwitch(true, 'Global lockdown');
    await expect(
      publisher.publishVideo({
        accountId: 'acc-valid',
        mediaPath: '/tmp/sample.mp4',
        caption: 'Test video',
        hasValidSession: true,
      })
    ).rejects.toThrow(/Operational Kill Switch is ACTIVE/);
  });

  it('successfully publishes and records publish audit entry', async () => {
    const mockUploader = vi.fn().mockResolvedValue({
      success: true,
      publishedVideoId: 'tt_vid_998877',
      url: 'https://www.tiktok.com/@creator/video/998877',
    });

    const customPublisher = new ContentPublisher({
      killSwitch,
      uploaderDriver: mockUploader,
    });

    const result = await customPublisher.publishVideo({
      accountId: 'acc-1',
      mediaPath: '/tmp/viral.mp4',
      caption: '3 habits for deep work #focus',
      hasValidSession: true,
    });

    expect(result.success).toBe(true);
    expect(result.publishedVideoId).toBe('tt_vid_998877');
    expect(result.url).toBe('https://www.tiktok.com/@creator/video/998877');

    const auditTrail = customPublisher.getAuditLog();
    expect(auditTrail).toHaveLength(1);
    expect(auditTrail[0].accountId).toBe('acc-1');
    expect(auditTrail[0].publishedVideoId).toBe('tt_vid_998877');
  });

  it('throws PUBLISHER_NOT_CONFIGURED if no driver supplied', () => {
    // @ts-expect-error testing missing driver
    expect(() => new ContentPublisher({ killSwitch })).toThrow(/PUBLISHER_NOT_CONFIGURED/);
  });
});
