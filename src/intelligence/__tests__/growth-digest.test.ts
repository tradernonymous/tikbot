import { describe, it, expect } from 'vitest';
import {
  generateGrowthDigest,
  GrowthDigestInput,
} from '../growth-digest';

describe('G4.2 Growth Digest Notifications (Outliers, Sounds, Anomalies)', () => {
  it('aggregates new outliers, rising sounds, and anomalies into a formatted digest', () => {
    const input: GrowthDigestInput = {
      timeframe: 'DAILY',
      newOutliers: [
        { id: 'out-1', author: 'viral_node', score: 9.4 },
        { id: 'out-2', author: 'tiktok_guru', score: 6.2 },
      ],
      risingSounds: [
        { id: 'snd-1', title: 'Cyber Drift Bass', velocity: 94 },
      ],
      trendMovers: [
        { topic: 'AI Agent Workflows', changePercent: 120 },
      ],
      accountAnomalies: [
        { accountId: 'acc-alpha', type: 'CAPTCHA_SPIKE', severity: 'HIGH' },
      ],
    };

    const digest = generateGrowthDigest(input);

    expect(digest.timeframe).toBe('DAILY');
    expect(digest.sections.outliersCount).toBe(2);
    expect(digest.sections.topOutlier?.author).toBe('viral_node');
    expect(digest.sections.risingSoundsCount).toBe(1);
    expect(digest.sections.anomalyCount).toBe(1);
    expect(digest.sections.highRiskAccounts).toContain('acc-alpha');

    // Formatted markdown includes key sections
    expect(digest.formattedMarkdown).toContain('Daily Growth Digest');
    expect(digest.formattedMarkdown).toContain('viral_node');
    expect(digest.formattedMarkdown).toContain('Cyber Drift Bass');
    expect(digest.formattedMarkdown).toContain('CAPTCHA_SPIKE');
  });
});
