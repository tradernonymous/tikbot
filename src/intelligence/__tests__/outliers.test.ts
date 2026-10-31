import { describe, it, expect } from 'vitest';
import {
  calculateEngagementRate,
  calculateMedian,
  calculateMAD,
  detectOutliers,
  scoreOutlierAgainstBaseline,
  type VideoPerformanceMetric,
} from '../outliers';

describe('Outlier Post Finder & Engagement Scoring', () => {
  it('calculates weighted engagement rate correctly', () => {
    // likes (1x), comments (2x), shares (3x) / views
    const rate = calculateEngagementRate({
      views: 10000,
      likes: 500,
      comments: 50, // 100
      shares: 50,   // 150
    });

    // (500 + 100 + 150) / 10000 = 750 / 10000 = 0.075 (7.5%)
    expect(rate).toBeCloseTo(0.075, 4);
  });

  it('calculates median for odd and even length arrays', () => {
    expect(calculateMedian([10, 20, 30])).toBe(20);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
    expect(calculateMedian([])).toBe(0);
  });

  it('identifies statistical outlier posts based on median ratios', () => {
    const posts: VideoPerformanceMetric[] = [
      { id: 'p1', views: 10000, likes: 500, comments: 20, shares: 10 },
      { id: 'p2', views: 12000, likes: 600, comments: 25, shares: 12 },
      { id: 'p3', views: 11000, likes: 550, comments: 22, shares: 11 },
      { id: 'p4', views: 9500, likes: 480, comments: 19, shares: 9 },
      // Viral outlier post: 150k views (15x views, high engagement)
      { id: 'outlier-1', views: 150000, likes: 18000, comments: 1200, shares: 3500 },
    ];

    const results = detectOutliers(posts);
    expect(results).toHaveLength(5);

    const outlier = results.find((r) => r.id === 'outlier-1');
    expect(outlier?.isOutlier).toBe(true);
    expect(outlier?.outlierMultiplier).toBeGreaterThan(5);

    const normal = results.find((r) => r.id === 'p1');
    expect(normal?.isOutlier).toBe(false);
  });

  it('calculates Median Absolute Deviation (MAD)', () => {
    // Array: [1, 2, 3, 4, 5, 6, 9]. Median = 4
    // Deviations: [3, 2, 1, 0, 1, 2, 5]. Sorted: [0, 1, 1, 2, 2, 3, 5]. Median = 2
    expect(calculateMAD([1, 2, 3, 4, 5, 6, 9])).toBe(2);
  });

  it('requires >= minSampleSize baseline posts to declare outlier with high confidence', () => {
    const baselineSmall = [10000, 12000, 11000]; // sample size 3 < minSampleSize (5)
    const resultSmall = scoreOutlierAgainstBaseline(150000, baselineSmall, 5);

    expect(resultSmall.hasSufficientBaseline).toBe(false);
    expect(resultSmall.confidence).toBeLessThan(0.5);
    expect(resultSmall.isOutlier).toBe(false);

    // Full baseline of 8 posts (>= 5)
    const baselineFull = [10000, 12000, 11000, 9500, 10500, 11500, 10200, 9800];
    const resultFull1 = scoreOutlierAgainstBaseline(150000, baselineFull, 5);
    const resultFull2 = scoreOutlierAgainstBaseline(150000, baselineFull, 5);

    expect(resultFull1.hasSufficientBaseline).toBe(true);
    expect(resultFull1.isOutlier).toBe(true);
    expect(resultFull1.outlierScore).toBeGreaterThan(5);
    expect(resultFull1.confidence).toBeGreaterThanOrEqual(0.8);
    // Reproducibility test
    expect(resultFull1.outlierScore).toBe(resultFull2.outlierScore);
    expect(resultFull1.median).toBe(resultFull2.median);
    expect(resultFull1.mad).toBe(resultFull2.mad);
  });
});
