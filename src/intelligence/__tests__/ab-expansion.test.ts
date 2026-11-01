import { describe, it, expect } from 'vitest';
import {
  evaluateABTestExpansion,
  ABTestEvaluationInput,
} from '../ab-expansion';

describe('G4.7 A/B Test Expansion (Covers, Captions, Auto-Winner Promotion)', () => {
  it('identifies winning Cover variant with statistically significant engagement rate', () => {
    const input: ABTestEvaluationInput = {
      testId: 'ab-cover-101',
      windowHours: 24,
      minSampleSize: 1000,
      variants: [
        {
          variantId: 'cov-a',
          variantType: 'COVER',
          label: 'High Contrast Neon Red',
          impressions: 5000,
          engagements: 650, // 13% engagement
          watchTimeSecondsTotal: 45000,
        },
        {
          variantId: 'cov-b',
          variantType: 'COVER',
          label: 'Default Frame Neutral',
          impressions: 5000,
          engagements: 250, // 5% engagement
          watchTimeSecondsTotal: 25000,
        },
      ],
    };

    const result = evaluateABTestExpansion(input);

    expect(result.status).toBe('WINNER_PROMOTED');
    expect(result.winningVariantId).toBe('cov-a');
    expect(result.winningVariantLabel).toBe('High Contrast Neon Red');
    expect(result.isStatisticallySignificant).toBe(true);
    expect(result.confidenceLevelPercent).toBeGreaterThanOrEqual(95);
    expect(result.recommendation).toContain('Promote');
  });

  it('marks test as INCONCLUSIVE when sample size is too low or variance is not statistically significant', () => {
    const input: ABTestEvaluationInput = {
      testId: 'ab-caption-102',
      windowHours: 24,
      minSampleSize: 1000,
      variants: [
        {
          variantId: 'cap-1',
          variantType: 'CAPTION',
          label: 'Caption Short',
          impressions: 40,
          engagements: 2,
          watchTimeSecondsTotal: 200,
        },
        {
          variantId: 'cap-2',
          variantType: 'CAPTION',
          label: 'Caption Long',
          impressions: 35,
          engagements: 2,
          watchTimeSecondsTotal: 180,
        },
      ],
    };

    const result = evaluateABTestExpansion(input);

    expect(result.status).toBe('INCONCLUSIVE');
    expect(result.isStatisticallySignificant).toBe(false);
    expect(result.winningVariantId).toBeUndefined();
  });
});
