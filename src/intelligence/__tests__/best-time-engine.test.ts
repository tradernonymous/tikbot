import { describe, it, expect } from 'vitest';
import {
  calculateBestPostingTimes,
  BestTimeEngineInput,
  PostMetricSample,
} from '../best-time-engine';

describe('G4.1 Best-Time Engine (Min-Sample Honesty & Velocity Heatmap)', () => {
  it('refuses to recommend posting times below N=10 samples (Min-sample honesty)', () => {
    const samples: PostMetricSample[] = [
      { id: 'p1', publishedAt: '2026-10-01T14:00:00Z', viewsAt1h: 500, viewsAt24h: 3000 },
      { id: 'p2', publishedAt: '2026-10-02T18:00:00Z', viewsAt1h: 1200, viewsAt24h: 8000 },
    ];

    const result = calculateBestPostingTimes({
      accountId: 'acc-new',
      samples,
    });

    expect(result.hasSufficientData).toBe(false);
    expect(result.sampleCount).toBe(2);
    expect(result.recommendedSlots).toHaveLength(0);
    expect(result.provenance).toBe('unknown');
    expect(result.message).toContain('Minimum 10 posts required');
  });

  it('calculates 7x24 heatmap and ranks top time slots when N >= 10 samples', () => {
    const samples: PostMetricSample[] = [];

    // Generate 12 samples with peak at Tuesday 18:00 (day 2, hour 18)
    for (let i = 0; i < 12; i++) {
      const isPeak = i % 2 === 0;
      samples.push({
        id: `post-${i}`,
        // Tuesday (day 2) 18:00 UTC vs Tuesday 04:00 UTC
        publishedAt: isPeak ? '2026-10-06T18:00:00Z' : '2026-10-06T04:00:00Z',
        viewsAt1h: isPeak ? 15000 : 100,
        viewsAt24h: isPeak ? 25000 : 2000,
      });
    }

    const result = calculateBestPostingTimes({
      accountId: 'acc-mature',
      samples,
    });

    expect(result.hasSufficientData).toBe(true);
    expect(result.sampleCount).toBe(12);
    expect(result.provenance).toBe('live');
    expect(result.recommendedSlots.length).toBeGreaterThan(0);

    const topSlot = result.recommendedSlots[0];
    expect(topSlot.dayOfWeek).toBe(2); // Tuesday
    expect(topSlot.hourUtc).toBe(18); // 18:00
    expect(topSlot.velocityScore).toBeGreaterThan(50);
  });
});
