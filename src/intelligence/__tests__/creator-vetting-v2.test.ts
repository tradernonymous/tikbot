import { describe, it, expect } from 'vitest';
import {
  evaluateCreatorAuthenticity,
  CreatorVettingInput,
} from '../creator-vetting-v2';

describe('G4.5 Creator Vetting Score v2 (Engagement Authenticity & Fraud Flags)', () => {
  it('identifies genuine creator with healthy like/view ratios and high authenticity score', () => {
    const input: CreatorVettingInput = {
      handle: 'real_creator',
      followerCount: 25000,
      posts: [
        { views: 40000, likes: 3200, comments: 140, shares: 80, commentSnippets: ['Great tips!', 'Tried this today and it worked'] },
        { views: 60000, likes: 4800, comments: 210, shares: 120, commentSnippets: ['Part 2 please', 'Mind blown'] },
      ],
      osintCrossCheck: {
        accountAgeDays: 420,
        hasVerifiedBioLink: true,
        detectedPlatforms: ['TIKTOK', 'YOUTUBE', 'INSTAGRAM'],
      },
    };

    const result = evaluateCreatorAuthenticity(input);

    expect(result.authenticityScore).toBeGreaterThanOrEqual(85);
    expect(result.fraudFlags).toHaveLength(0);
    expect(result.riskTier).toBe('LOW');
  });

  it('detects bot farms and flags SUSPICIOUS_LIKE_RATIO and BOT_COMMENT_CLUSTER', () => {
    const input: CreatorVettingInput = {
      handle: 'bot_inflated_hub',
      followerCount: 200000,
      posts: [
        // 100k views but only 20 likes (0.02% like ratio)
        { views: 100000, likes: 20, comments: 500, shares: 0, commentSnippets: ['nice', 'nice', 'nice', '🔥', '🔥'] },
      ],
      osintCrossCheck: {
        accountAgeDays: 12,
        hasVerifiedBioLink: false,
        detectedPlatforms: ['TIKTOK'],
      },
    };

    const result = evaluateCreatorAuthenticity(input);

    expect(result.authenticityScore).toBeLessThan(50);
    expect(result.fraudFlags).toContain('SUSPICIOUS_LIKE_RATIO');
    expect(result.fraudFlags).toContain('BOT_COMMENT_CLUSTER');
    expect(result.riskTier).toBe('HIGH');
  });
});
