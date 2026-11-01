export interface BoostPlanSpecification {
  targetPostUrl: string;
  totalTargetViews: number;
  windowHours: number;
  instantBurst: boolean;
  likeRatio: number; // e.g. 0.10 (10%)
  commentRatio: number; // e.g. 0.03 (3%)
  directUrlFraction: number; // 0 to 1.0
}

export type PlausibilityRating = 'GREEN' | 'AMBER' | 'RED';

export interface PlausibilitySimulationResult {
  score: number; // 0 to 100
  rating: PlausibilityRating;
  blockLaunch: boolean;
  requiresAcknowledgment: boolean;
  violations: string[];
  recommendations: string[];
}

export class PlausibilitySimulator {
  simulatePlan(plan: BoostPlanSpecification): PlausibilitySimulationResult {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 1. Instant Burst check
    if (plan.instantBurst) {
      violations.push('Instant flat burst pattern trips algorithmic spam filters (DocRef: Artificial Amplification)');
      score -= 50;
    }

    // 2. Implausible Like Ratio (>30% is abnormal for general video traffic)
    if (plan.likeRatio > 0.35) {
      violations.push(`Like ratio ${(plan.likeRatio * 100).toFixed(0)}% exceeds organic plausibility ceiling (max 35%)`);
      score -= 30;
    }

    // 3. Implausible Comment Ratio (>15% is abnormal)
    if (plan.commentRatio > 0.15) {
      violations.push(`Comment ratio ${(plan.commentRatio * 100).toFixed(0)}% exceeds organic plausibility ceiling (max 15%)`);
      score -= 25;
    }

    // 4. Naked direct link fraction
    if (plan.directUrlFraction > 0.70) {
      violations.push(`Direct URL arrival ${(plan.directUrlFraction * 100).toFixed(0)}% lacks search/profile discovery diversity`);
      score -= 20;
    }

    // 5. Unrealistic velocity
    const viewsPerHour = plan.totalTargetViews / Math.max(1, plan.windowHours);
    if (viewsPerHour > 5000 && plan.windowHours < 2) {
      violations.push(`Velocity of ${Math.round(viewsPerHour)} views/hr over short window poses high velocity anomaly risk`);
      score -= 25;
    }

    score = Math.max(0, score);

    let rating: PlausibilityRating = 'GREEN';
    let blockLaunch = false;
    let requiresAcknowledgment = false;

    if (score < 50 || violations.length >= 2) {
      rating = 'RED';
      blockLaunch = true;
    } else if (score < 80) {
      rating = 'AMBER';
      requiresAcknowledgment = true;
      recommendations.push('Consider widening execution window or lowering engagement ratios.');
    }

    return {
      score,
      rating,
      blockLaunch,
      requiresAcknowledgment,
      violations,
      recommendations,
    };
  }
}
