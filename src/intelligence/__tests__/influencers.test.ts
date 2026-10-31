import { describe, it, expect } from 'vitest';
import {
  calculateInfluencerFit,
  type InfluencerProfileCandidate,
} from '../influencers';

describe('Influencer Prospecting & Fit Scoring', () => {
  it('calculates high fit score for aligned creator with strong engagement', () => {
    const candidate: InfluencerProfileCandidate = {
      handle: 'saas_marketing_pro',
      followerCount: 50000,
      recentViews: [40000, 45000, 52000, 48000, 60000],
      averageEngagementRate: 0.08, // 8%
      bioKeywords: ['b2b', 'saas', 'growth', 'marketing', 'hooks'],
    };

    const result = calculateInfluencerFit(candidate, ['saas', 'growth', 'marketing']);

    expect(result.overallFitScore).toBeGreaterThanOrEqual(80);
    expect(result.fitTier).toBe('HIGH');
    expect(result.consistencyScore).toBeGreaterThan(70);
  });

  it('calculates lower fit score for inconsistent views and niche mismatch', () => {
    const candidate: InfluencerProfileCandidate = {
      handle: 'random_memes',
      followerCount: 200000,
      recentViews: [1000, 500000, 2000, 800000], // wildly inconsistent
      averageEngagementRate: 0.01,
      bioKeywords: ['comedy', 'memes', 'pranks'],
    };

    const result = calculateInfluencerFit(candidate, ['finance', 'investing']);

    expect(result.overallFitScore).toBeLessThan(50);
    expect(result.fitTier).toBe('LOW');
  });
});
