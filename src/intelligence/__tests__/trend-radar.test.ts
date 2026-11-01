import { describe, it, expect } from 'vitest';
import {
  calculateRisingScore,
  analyzeHashtagCoOccurrence,
  detectSoundLifecycle,
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

  it('detects sound lifecycle phase based on velocity and sample size', () => {
    const emerging = detectSoundLifecycle(25, 4);
    expect(emerging).toBe('EMERGING');

    const rising = detectSoundLifecycle(30, 50);
    expect(rising).toBe('RISING');

    const peak = detectSoundLifecycle(5, 50);
    expect(peak).toBe('PEAK');

    const declining = detectSoundLifecycle(-10, 50);
    expect(declining).toBe('DECLINING');
  });
});
