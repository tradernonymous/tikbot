import { describe, it, expect, vi } from 'vitest';
import {
  processOutlierBreach,
  OutlierPostEvent,
} from '../outlier-alerts';

describe('G4.6 Outlier Alert Wiring & Composer Jump', () => {
  it('generates notification and prefilled composer jump URL when outlier breaches threshold', () => {
    const event: OutlierPostEvent = {
      postId: 'post-999',
      authorHandle: 'speed_creator',
      views: 500000,
      baselineViews: 40000,
      outlierScore: 12.5,
      title: 'POV: What happens when you automate marketing',
      hookText: 'Stop doing this manual grind',
      videoUrl: 'https://tiktok.com/@speed_creator/video/999',
    };

    const result = processOutlierBreach(event, 3.0);

    expect(result.alertCreated).toBe(true);
    expect(result.notificationPayload?.title).toContain('12.5x Viral Outlier');
    expect(result.composerJumpUrl).toContain('/dashboard/composer');
    expect(result.composerJumpUrl).toContain('Stop%20doing%20this%20manual%20grind');
    expect(result.composerJumpUrl).toContain('carriedFrom=outlier');
  });

  it('ignores post that does not breach outlier multiplier threshold', () => {
    const event: OutlierPostEvent = {
      postId: 'post-101',
      authorHandle: 'regular_user',
      views: 12000,
      baselineViews: 10000,
      outlierScore: 1.2,
      title: 'Standard day in the life',
      videoUrl: 'https://tiktok.com/@regular_user/video/101',
    };

    const result = processOutlierBreach(event, 3.0);
    expect(result.alertCreated).toBe(false);
    expect(result.composerJumpUrl).toBeUndefined();
  });
});
