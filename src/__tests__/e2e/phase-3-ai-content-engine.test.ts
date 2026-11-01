import { describe, it, expect, beforeEach } from 'vitest';
import { generateVideoAsset } from '@/content/video-generator';
import { generateScriptVariants } from '@/content/script-generator';
import { generateAutoContentPlan, approveContentPlanItem } from '@/content/auto-plan';
import { extractRankedClips, convertClipToVariant } from '@/content/smart-clipping';
import { suggestHashtagPortfolio } from '@/content/hashtag-suggester';
import { extractCandidateCoverFrames } from '@/content/cover-frame-picker';
import {
  assertVariantIntegrity,
  registerPublishedVariant,
  resetVariantIntegrityRegistryForTesting,
  DuplicateVariantBlockedError,
} from '@/content/variant-integrity-guard';
import { ContentPublisher } from '@/content/publisher';
import { KillSwitchManager } from '@/security/kill-switch';

describe('Phase 3 E2E — AI Content Engine Flow', () => {
  beforeEach(() => {
    resetVariantIntegrityRegistryForTesting();
  });

  it('runs complete marketing loop: Trend -> Script -> Render -> Caption/Cover -> Approval -> Publish with byte guard', async () => {
    // 1. Ingest Trend Signal into Auto Content Plan
    const autoPlan = await generateAutoContentPlan({
      accountId: 'acc-growth-alpha',
      trendSignals: [{ topic: '3 AI Tools That Replace 10 Hours of Work', risingScore: 96 }],
    });
    expect(autoPlan).toHaveLength(1);
    const draftItem = autoPlan[0];
    expect(draftItem.status).toBe('DRAFT');

    // Human Approval 1: Content Plan Approval
    const approvedPlan = approveContentPlanItem(draftItem);
    expect(approvedPlan.status).toBe('APPROVED');

    // 2. Generate Hook Lab Pattern-Scored Scripts
    const scriptVariants = await generateScriptVariants({
      topic: approvedPlan.topic,
      sourceType: 'TREND_SIGNAL',
      keywords: ['automation', 'productivity', 'workflows'],
    });
    expect(scriptVariants).toHaveLength(3);
    const chosenScript = scriptVariants[0];
    expect(chosenScript.retentionScore).toBeGreaterThanOrEqual(80);

    // 3. Render 9:16 Video Asset via Generation Sidecar
    const renderResult = await generateVideoAsset({
      template: 'FACELESS_LISTICLE',
      script: chosenScript.fullScript,
      aspectRatio: '9:16',
      includeCaptions: true,
    });
    expect(renderResult.status).toBe('COMPLETED');
    expect(renderResult.fingerprintSha256).toBeTruthy();

    // 4. Generate Balanced Hashtag Portfolio Mix & Cover Frame
    const hashtagResult = suggestHashtagPortfolio({
      topic: approvedPlan.topic,
      trendRadarTags: [
        { tag: '#productivity', risingScore: 92, volume: 3000000 },
        { tag: '#aitools', risingScore: 95, volume: 800000 },
        { tag: '#creatorhacks', risingScore: 88, volume: 45000 },
      ],
    });
    expect(hashtagResult.formattedCaptionAppend).toContain('#productivity');

    const coverFrames = extractCandidateCoverFrames({
      videoDurationSeconds: renderResult.durationSeconds,
      sampleCount: 5,
      videoAssetPath: renderResult.outputPath,
    });
    const bestCover = coverFrames.find((f) => f.isRecommended);
    expect(bestCover).toBeDefined();

    // 5. Publish Post with Variant Integrity Guard
    const killSwitch = new KillSwitchManager();
    const publisher = new ContentPublisher({
      killSwitch,
      uploaderDriver: async (req) => ({
        success: true,
        publishedVideoId: 'tt-vid-12345',
        url: 'https://tiktok.com/@growth_alpha/video/12345',
        privacyLevel: 'SELF_ONLY',
      }),
    });

    const publishResult = await publisher.publishVideo({
      accountId: 'acc-growth-alpha',
      mediaPath: renderResult.outputPath,
      fingerprintSha256: renderResult.fingerprintSha256,
      caption: `${chosenScript.hookText} ${hashtagResult.formattedCaptionAppend}`,
      hasValidSession: true,
    });

    expect(publishResult.success).toBe(true);
    expect(publishResult.publishedVideoId).toBe('tt-vid-12345');

    // 6. Assert Variant Integrity Guard blocks duplicate bytes on another account
    expect(() => {
      assertVariantIntegrity(
        {
          accountId: 'acc-growth-beta',
          fingerprintSha256: renderResult.fingerprintSha256,
        },
        { throwOnBlock: true }
      );
    }).toThrow(DuplicateVariantBlockedError);
  });
});
