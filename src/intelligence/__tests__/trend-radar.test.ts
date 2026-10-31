import { describe, it, expect } from 'vitest';
import {
  calculateRisingScore,
  analyzeHashtagCoOccurrence,
  TrendHashtagSample,
} from '../trend-radar';

describe('Trend Radar Intelligence (G6.1)', () => {
  it('calculates rising score based on volume and velocity over time', () => {
    const score = calculateRisingScore({
      currentVolume: 150000,
      previousVolume: 50000,
      hoursDiff: 24,
    });

    // 200% growth over 24h produces a high rising score
    expect(score).toBeGreaterThan(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('builds hashtag co-occurrence graph from post captions', () => {
    const samples: TrendHashtagSample[] = [
      { id: '1', tags: ['dropshipping', 'ecommerce', 'sidehustle'] },
      { id: '2', tags: ['dropshipping', 'ecommerce', 'shopify'] },
      { id: '3', tags: ['dropshipping', 'sidehustle'] },
    ];

    const coOccurrence = analyzeHashtagCoOccurrence(samples, 'dropshipping');

    expect(coOccurrence[0].tag).toBe('ecommerce');
    expect(coOccurrence[0].count).toBe(2);
    expect(coOccurrence[1].tag).toBe('sidehustle');
    expect(coOccurrence[1].count).toBe(2);
  });
});
