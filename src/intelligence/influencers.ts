export interface InfluencerProfileCandidate {
  handle: string;
  followerCount: number;
  recentViews: number[];
  averageEngagementRate: number; // e.g. 0.05 for 5%
  bioKeywords: string[];
}

export type FitTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface InfluencerFitScoreResult {
  handle: string;
  overallFitScore: number; // 0 - 100
  fitTier: FitTier;
  consistencyScore: number; // 0 - 100
  resonanceScore: number;   // 0 - 100
  relevanceScore: number;   // 0 - 100
}

function calculateConsistency(views: number[]): number {
  if (views.length <= 1) return 50;

  const mean = views.reduce((a, b) => a + b, 0) / views.length;
  if (mean === 0) return 0;

  const variance =
    views.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / views.length;
  const standardDev = Math.sqrt(variance);
  const coefficientOfVariation = standardDev / mean;

  // Lower coefficient of variation means higher consistency
  // If CV <= 0.3, consistency is close to 100
  // If CV >= 1.5, consistency is near 10
  const score = Math.max(10, Math.min(100, Math.round(100 - coefficientOfVariation * 40)));
  return score;
}

export function calculateInfluencerFit(
  candidate: InfluencerProfileCandidate,
  targetPillars: string[]
): InfluencerFitScoreResult {
  // 1. Consistency Score (0 - 100)
  const consistencyScore = calculateConsistency(candidate.recentViews);

  // 2. Resonance Score: based on engagement rate (benchmark: 5% is standard good, 10% is top tier)
  const resonanceScore = Math.min(100, Math.round((candidate.averageEngagementRate / 0.08) * 85));

  // 3. Relevance Score: based on keyword overlap with target pillars
  const candidateWords = new Set(candidate.bioKeywords.map((k) => k.toLowerCase()));
  const matches = targetPillars.filter((p) => candidateWords.has(p.toLowerCase())).length;
  const relevanceScore =
    targetPillars.length > 0
      ? Math.min(100, Math.round((matches / targetPillars.length) * 100))
      : 50;

  // 4. Weighted Overall Fit
  // 35% Consistency + 35% Resonance + 30% Relevance
  const overallFitScore = Math.round(
    consistencyScore * 0.35 + resonanceScore * 0.35 + relevanceScore * 0.3
  );

  let fitTier: FitTier = 'MEDIUM';
  if (overallFitScore >= 75) {
    fitTier = 'HIGH';
  } else if (overallFitScore < 50) {
    fitTier = 'LOW';
  }

  return {
    handle: candidate.handle,
    overallFitScore,
    fitTier,
    consistencyScore,
    resonanceScore,
    relevanceScore,
  };
}
