import { describe, it, expect } from 'vitest';
import { EngagementRiskScorer, CampaignMetricsTracker } from '../risk-scorer';

describe('EngagementRiskScorer', () => {
  const scorer = new EngagementRiskScorer();

  it('calculates a LOW risk score for conservative, warmed account campaigns', () => {
    const assessment = scorer.assessCampaign({
      totalActions: 20,
      targetDurationHours: 4,
      accountStates: ['WARMING', 'ACTIVE', 'ACTIVE'],
      proxiesAssigned: 3,
      hasManualApproval: true,
    });

    expect(assessment.riskScore).toBeLessThan(35);
    expect(assessment.riskTier).toBe('LOW');
    expect(assessment.recommendations).toHaveLength(0);
    expect(assessment.autoPauseRequired).toBe(false);
  });

  it('calculates a CRITICAL risk score and triggers autoPause if unapproved with high velocity and unwarmed accounts', () => {
    const assessment = scorer.assessCampaign({
      totalActions: 500,
      targetDurationHours: 1,
      accountStates: ['CREATED', 'CREATED', 'COOLDOWN'],
      proxiesAssigned: 1,
      hasManualApproval: false,
    });

    expect(assessment.riskScore).toBeGreaterThanOrEqual(80);
    expect(assessment.riskTier).toBe('CRITICAL');
    expect(assessment.autoPauseRequired).toBe(true);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });

  it('detects high challenge rates during execution and advises immediate pause', () => {
    const result = scorer.evaluateExecutionHealth({
      actionsCompleted: 100,
      challengesEncountered: 20,
      rateLimitsHit: 5,
    });

    expect(result.challengeRate).toBe(0.2); // 20%
    expect(result.shouldAutoPause).toBe(true);
    expect(result.alertReason).toMatch(/Challenge rate exceeded safe threshold/);
  });
});

describe('CampaignMetricsTracker', () => {
  const tracker = new CampaignMetricsTracker();

  it('computes before and after metrics delta and lift percentage', () => {
    const baseline = { views: 1000, likes: 50, comments: 5, shares: 2 };
    const final = { views: 2500, likes: 150, comments: 20, shares: 10 };

    const outcome = tracker.calculateOutcome(baseline, final);

    expect(outcome.delta.views).toBe(1500);
    expect(outcome.delta.likes).toBe(100);
    expect(outcome.liftPercent.views).toBe(150); // 150% lift
    expect(outcome.liftPercent.likes).toBe(200); // 200% lift
  });
});
