import { HookType } from './transcripts';

export interface HookVariant {
  type: HookType;
  text: string;
}

export function generateHookVariants(baseText: string): HookVariant[] {
  const cleanBase = baseText.trim().replace(/[.!?]+$/, '');

  return [
    {
      type: 'CONTRARIAN',
      text: `Stop ${cleanBase.toLowerCase().replace(/^(how to|why you should|ways to)\s*/i, '')} until you watch this.`,
    },
    {
      type: 'QUESTION',
      text: `Did you know this about ${cleanBase.toLowerCase()}?`,
    },
    {
      type: 'NEGATIVE_CONSTRAINT',
      text: `Never ignore this rule if you want to ${cleanBase.toLowerCase()}.`,
    },
    {
      type: 'RESULT_STORY',
      text: `How I mastered ${cleanBase.toLowerCase()} in 30 days without burning out.`,
    },
  ];
}

export interface ABVariantData {
  id: string;
  views: number;
  retentionRate: number;
}

export interface ABEvaluationResult {
  winnerId: string | null;
  liftPercentage: number;
  isSignificant: boolean;
}

export function evaluateABHookTest(
  variantA: ABVariantData,
  variantB: ABVariantData
): ABEvaluationResult {
  const scoreA = variantA.views * variantA.retentionRate;
  const scoreB = variantB.views * variantB.retentionRate;

  if (scoreA === 0 && scoreB === 0) {
    return { winnerId: null, liftPercentage: 0, isSignificant: false };
  }

  const higherScore = Math.max(scoreA, scoreB);
  const lowerScore = Math.min(scoreA, scoreB);
  const winnerId = scoreB > scoreA ? variantB.id : variantA.id;

  const liftPercentage = lowerScore > 0 ? ((higherScore - lowerScore) / lowerScore) * 100 : 100;
  // Consider statistically significant if minimum 1000 views on both and lift >= 15%
  const isSignificant =
    variantA.views >= 1000 &&
    variantB.views >= 1000 &&
    liftPercentage >= 15;

  return {
    winnerId: isSignificant ? winnerId : null,
    liftPercentage: Math.round(liftPercentage * 10) / 10,
    isSignificant,
  };
}
