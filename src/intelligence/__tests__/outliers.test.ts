import { describe, it, expect } from 'vitest';
import {
  calculateEngagementRate,
  calculateMedian,
  detectOutliers,
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
});
