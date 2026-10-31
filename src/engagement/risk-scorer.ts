import { AccountState } from '../farm/account-lifecycle';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CampaignRiskAssessmentInput {
  totalActions: number;
  targetDurationHours: number;
  accountStates: AccountState[];
  proxiesAssigned: number;
  hasManualApproval: boolean;
}

export interface CampaignRiskAssessment {
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  recommendations: string[];
  autoPauseRequired: boolean;
}

export interface ExecutionHealthInput {
  actionsCompleted: number;
  challengesEncountered: number;
  rateLimitsHit: number;
}

export interface ExecutionHealthResult {
  challengeRate: number;
  shouldAutoPause: boolean;
  alertReason?: string;
}

export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
}

export interface CampaignOutcome {
  delta: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
  };
  liftPercent: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
  };
}

export class EngagementRiskScorer {
  assessCampaign(input: CampaignRiskAssessmentInput): CampaignRiskAssessment {
    let score = 0;
    const recommendations: string[] = [];

    // 1. Velocity factor
    const actionsPerHour = input.targetDurationHours > 0 ? input.totalActions / input.targetDurationHours : input.totalActions;
    if (actionsPerHour > 100) {
      score += 40;
      recommendations.push('Reduce velocity: more than 100 actions/hour triggers platform anti-spam heuristics.');
    } else if (actionsPerHour > 40) {
      score += 20;
      recommendations.push('Moderate velocity: consider stretching campaign over a longer duration.');
    }

    // 2. Account state factor
    const unwarmedCount = input.accountStates.filter(s => s === 'CREATED' || s === 'COOLDOWN').length;
    if (unwarmedCount > 0) {
      score += Math.min(30, unwarmedCount * 15);
      recommendations.push(`Use warmed accounts: ${unwarmedCount} account(s) are in CREATED or COOLDOWN state.`);
    }

    // 3. Proxy diversity factor
    if (input.accountStates.length > input.proxiesAssigned) {
      score += 15;
      recommendations.push('Bind dedicated sticky proxies: accounts are sharing proxies, which increases ban risk.');
    }

    // 4. Governance factor
    if (!input.hasManualApproval) {
      score += 25;
      recommendations.push('Manual operator approval is required to verify campaign parameters before launch.');
    }

    // Normalize 0 - 100
    const riskScore = Math.min(100, Math.max(0, score));

    let riskTier: RiskTier = 'LOW';
    if (riskScore >= 80) riskTier = 'CRITICAL';
    else if (riskScore >= 60) riskTier = 'HIGH';
    else if (riskScore >= 35) riskTier = 'MEDIUM';

    return {
      riskScore,
      riskTier,
      recommendations,
      autoPauseRequired: riskScore >= 80,
    };
  }

  evaluateExecutionHealth(input: ExecutionHealthInput): ExecutionHealthResult {
    const total = input.actionsCompleted || 1;
    const challengeRate = Number((input.challengesEncountered / total).toFixed(2));

    if (challengeRate >= 0.15) {
      return {
        challengeRate,
        shouldAutoPause: true,
        alertReason: `Challenge rate exceeded safe threshold (${Math.round(challengeRate * 100)}% >= 15%). Auto-pausing campaign to protect accounts.`,
      };
    }

    if (input.rateLimitsHit >= 3) {
      return {
        challengeRate,
        shouldAutoPause: true,
        alertReason: `Multiple rate limits encountered (${input.rateLimitsHit}). Auto-pausing campaign for cooldown.`,
      };
    }

    return {
      challengeRate,
      shouldAutoPause: false,
    };
  }
}

export class CampaignMetricsTracker {
  calculateOutcome(baseline: PostMetrics, final: PostMetrics): CampaignOutcome {
    const calcLift = (b: number, f: number) => {
      if (b === 0) return f > 0 ? 100 : 0;
      return Number((((f - b) / b) * 100).toFixed(2));
    };

    return {
      delta: {
        views: final.views - baseline.views,
        likes: final.likes - baseline.likes,
        comments: final.comments - baseline.comments,
        shares: final.shares - baseline.shares,
        saves: final.saves !== undefined && baseline.saves !== undefined ? final.saves - baseline.saves : undefined,
      },
      liftPercent: {
        views: calcLift(baseline.views, final.views),
        likes: calcLift(baseline.likes, final.likes),
        comments: calcLift(baseline.comments, final.comments),
        shares: calcLift(baseline.shares, final.shares),
        saves: final.saves !== undefined && baseline.saves !== undefined ? calcLift(baseline.saves, final.saves) : undefined,
      },
    };
  }
}
