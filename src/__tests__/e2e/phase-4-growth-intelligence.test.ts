import { describe, it, expect } from 'vitest';
import { calculateBestPostingTimes } from '@/intelligence/best-time-engine';
import { generateGrowthDigest } from '@/intelligence/growth-digest';
import { trackSoundLifecycle } from '@/intelligence/sound-tracker';
import { evaluateCreatorAuthenticity } from '@/intelligence/creator-vetting-v2';
import { processOutlierBreach } from '@/intelligence/outlier-alerts';
import { evaluateABTestExpansion } from '@/intelligence/ab-expansion';
import { suggestHashtagPortfolio } from '@/content/hashtag-suggester';

describe('Phase 4 E2E — Growth Intelligence Suite', () => {
  it('runs complete growth cycle: Best-Time -> Sound Tracker -> Creator Vetting -> Outlier Alert -> A/B Winner -> Digest', () => {
    // 1. Best-Time Engine with Min-Sample Honesty
    const insufficientResult = calculateBestPostingTimes({
      accountId: 'acc-new',
      samples: [{ id: 'p1', publishedAt: '2026-10-01T12:00:00Z', viewsAt1h: 10, viewsAt24h: 100 }],
    });
    expect(insufficientResult.hasSufficientData).toBe(false);
    expect(insufficientResult.provenance).toBe('unknown');

    const matureSamples = Array.from({ length: 15 }, (_, i) => ({
      id: `p-${i}`,
      publishedAt: '2026-10-06T18:00:00Z',
      viewsAt1h: 6000,
      viewsAt24h: 10000,
    }));
    const matureResult = calculateBestPostingTimes({
      accountId: 'acc-mature',
      samples: matureSamples,
    });
    expect(matureResult.hasSufficientData).toBe(true);
    expect(matureResult.provenance).toBe('live');
    expect(matureResult.recommendedSlots[0].hourUtc).toBe(18);

    // 2. Sound Lifecycle Tracker with Crossover Alert
    const soundSnapshots = [
      { soundId: 's-fast', title: 'Speed Drift Anthem', author: 'music_lab', videoCount: 2000, timestamp: '2026-10-25T00:00:00Z' },
      { soundId: 's-fast', title: 'Speed Drift Anthem', author: 'music_lab', videoCount: 8000, timestamp: '2026-10-29T00:00:00Z' },
    ];
    const soundAnalysis = trackSoundLifecycle(soundSnapshots, 50);
    expect(soundAnalysis.phase).toBe('RISING');
    expect(soundAnalysis.alertTriggered).toBe(true);

    // 3. Creator Vetting Score v2
    const creatorEvaluation = evaluateCreatorAuthenticity({
      handle: 'viral_talent',
      followerCount: 50000,
      posts: [
        { views: 80000, likes: 6400, comments: 220, shares: 90, commentSnippets: ['Love this!', 'Super helpful', 'Trying this'] },
      ],
      osintCrossCheck: { accountAgeDays: 300, hasVerifiedBioLink: true, detectedPlatforms: ['TIKTOK', 'YOUTUBE'] },
    });
    expect(creatorEvaluation.authenticityScore).toBeGreaterThanOrEqual(80);
    expect(creatorEvaluation.fraudFlags).toHaveLength(0);

    // 4. Outlier Alert Wiring -> Composer Jump
    const outlierResult = processOutlierBreach({
      postId: 'breakout-post-1',
      authorHandle: 'viral_talent',
      views: 750000,
      baselineViews: 50000,
      outlierScore: 15.0,
      title: 'How to scale automation',
      hookText: 'Stop wasting hours',
      videoUrl: 'https://tiktok.com/@viral_talent/video/1',
    });
    expect(outlierResult.alertCreated).toBe(true);
    expect(outlierResult.composerJumpUrl).toContain('/dashboard/composer');

    // 5. A/B Test Expansion & Winner Promotion
    const abEvaluation = evaluateABTestExpansion({
      testId: 'ab-covers-2026',
      windowHours: 24,
      minSampleSize: 500,
      variants: [
        { variantId: 'c1', variantType: 'COVER', label: 'Bold Neon', impressions: 2000, engagements: 300, watchTimeSecondsTotal: 20000 },
        { variantId: 'c2', variantType: 'COVER', label: 'Muted', impressions: 2000, engagements: 80, watchTimeSecondsTotal: 12000 },
      ],
    });
    expect(abEvaluation.status).toBe('WINNER_PROMOTED');
    expect(abEvaluation.winningVariantId).toBe('c1');

    // 6. Growth Digest Compilation
    const digest = generateGrowthDigest({
      timeframe: 'DAILY',
      newOutliers: [{ id: 'breakout-post-1', author: 'viral_talent', score: 15.0 }],
      risingSounds: [{ id: 's-fast', title: 'Speed Drift Anthem', velocity: 96 }],
      trendMovers: [{ topic: 'Marketing Automation', changePercent: 150 }],
      accountAnomalies: [],
    });
    expect(digest.sections.outliersCount).toBe(1);
    expect(digest.sections.risingSoundsCount).toBe(1);
    expect(digest.formattedMarkdown).toContain('viral_talent');
  });
});
