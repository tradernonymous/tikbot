export type ABVariantType = 'HOOK' | 'COVER' | 'CAPTION';

export interface ABVariantSample {
  variantId: string;
  variantType: ABVariantType;
  label: string;
  impressions: number;
  engagements: number;
  watchTimeSecondsTotal: number;
}

export interface ABTestEvaluationInput {
  testId: string;
  variants: ABVariantSample[];
  windowHours: 24 | 72;
  minSampleSize?: number;
}

export interface ABTestEvaluationResult {
  testId: string;
  status: 'IN_PROGRESS' | 'WINNER_PROMOTED' | 'INCONCLUSIVE';
  winningVariantId?: string;
  winningVariantLabel?: string;
  confidenceLevelPercent: number;
  isStatisticallySignificant: boolean;
  recommendation: string;
}

export function evaluateABTestExpansion(
  input: ABTestEvaluationInput
): ABTestEvaluationResult {
  const minSamples = input.minSampleSize || 500;
  const variants = input.variants;

  if (!variants || variants.length < 2) {
    return {
      testId: input.testId,
      status: 'INCONCLUSIVE',
      confidenceLevelPercent: 0,
      isStatisticallySignificant: false,
      recommendation: 'At least two test variants are required to evaluate performance.',
    };
  }

  // Check minimum impressions across variants
  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
  if (totalImpressions < minSamples) {
    return {
      testId: input.testId,
      status: 'INCONCLUSIVE',
      confidenceLevelPercent: 0,
      isStatisticallySignificant: false,
      recommendation: `Insufficient impression sample size (${totalImpressions} < ${minSamples}). Continue data collection.`,
    };
  }

  // Calculate engagement rates
  const sorted = [...variants].sort((a, b) => {
    const rateA = a.impressions > 0 ? a.engagements / a.impressions : 0;
    const rateB = b.impressions > 0 ? b.engagements / b.impressions : 0;
    return rateB - rateA;
  });

  const v1 = sorted[0]; // leader
  const v2 = sorted[1]; // runner-up

  const n1 = v1.impressions;
  const x1 = v1.engagements;
  const n2 = v2.impressions;
  const x2 = v2.engagements;

  if (n1 === 0 || n2 === 0) {
    return {
      testId: input.testId,
      status: 'INCONCLUSIVE',
      confidenceLevelPercent: 0,
      isStatisticallySignificant: false,
      recommendation: 'One of the variants has 0 impressions recorded.',
    };
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;

  // Two-proportion pooled Z-test
  const pooledP = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  const z = se > 0 ? (p1 - p2) / se : 0;

  // z >= 1.96 corresponds to 95% confidence (p < 0.05)
  const isSignificant = z >= 1.96;
  const confidencePercent = isSignificant ? 95 : Math.min(90, Math.round((z / 1.96) * 95));

  if (isSignificant) {
    return {
      testId: input.testId,
      status: 'WINNER_PROMOTED',
      winningVariantId: v1.variantId,
      winningVariantLabel: v1.label,
      confidenceLevelPercent: confidencePercent,
      isStatisticallySignificant: true,
      recommendation: `Promote variant "${v1.label}" across all scheduling queues. Statistically significant ${Math.round((p1 - p2) * 100)}% engagement lift with 95% confidence.`,
    };
  }

  return {
    testId: input.testId,
    status: 'INCONCLUSIVE',
    confidenceLevelPercent: confidencePercent,
    isStatisticallySignificant: false,
    recommendation: `Difference between top variants is not yet statistically significant (z=${z.toFixed(2)} < 1.96). Continue testing until full ${input.windowHours}h window completes.`,
  };
}
