import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReachCanaryDetector,
  type ViewSample,
} from '../reach-canary';
import {
  calculateAccountHealthScore,
  type HealthScoreComponents,
} from '../account-health-score';
import {
  AutoQuarantineManager,
  type FarmerAccount,
} from '../auto-quarantine';
import {
  TargetCanaryMonitor,
  type TargetBoostCheckInput,
} from '../target-monitor';
import { IncidentLogManager } from '../incident-log';

describe('F2.1 Reach Canary Detector', () => {
  let canary: ReachCanaryDetector;

  beforeEach(() => {
    canary = new ReachCanaryDetector({
      consecutiveBreachesRequired: 2,
    });
  });

  it('detects healthy views within normal baseline band', () => {
    // History with median ~1000, MAD ~200. Threshold ~800
    const history = [950, 1050, 1000, 1100, 900];
    const check = canary.evaluatePostViews('acc-1', 920, history);

    expect(check.status).toBe('HEALTHY');
    expect(check.reachDropDetected).toBe(false);
    expect(check.provenance).toBe('live');
  });

  it('flags REACH_DROP when views fall below median minus MAD for consecutive checks', () => {
    const history = [1000, 1100, 950, 1050, 1000]; // median=1000, MAD=50. Cutoff ~950

    // Breach 1
    const check1 = canary.evaluatePostViews('acc-2', 400, history);
    expect(check1.consecutiveBreaches).toBe(1);
    expect(check1.reachDropDetected).toBe(false);

    // Breach 2 -> triggers REACH_DROP
    const check2 = canary.evaluatePostViews('acc-2', 350, history);
    expect(check2.consecutiveBreaches).toBe(2);
    expect(check2.reachDropDetected).toBe(true);
    expect(check2.status).toBe('REACH_DROP');
  });
});

describe('F2.2 Account Health Score', () => {
  it('computes composite score (0-100) with detailed component breakdown', () => {
    const components: HealthScoreComponents = {
      reachTrendRatio: 1.0, // 100% of baseline (30 pts)
      loginSuccessRate: 1.0, // 100% (20 pts)
      captchaChallengeCountLast7d: 0, // 0 captchas (25 pts)
      actionSuccessRate: 0.98, // 98% (15 pts)
      accountAgeDays: 45, // PRIME age (10 pts)
    };

    const result = calculateAccountHealthScore(components);
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.breakdown.reachPoints).toBe(30);
    expect(result.breakdown.securityPoints).toBe(25);
    expect(result.status).toBe('PRIME_HEALTH');
  });

  it('heavily penalizes score when captchas and reach drops occur', () => {
    const components: HealthScoreComponents = {
      reachTrendRatio: 0.2, // severe drop
      loginSuccessRate: 0.6,
      captchaChallengeCountLast7d: 5, // high challenge rate
      actionSuccessRate: 0.7,
      accountAgeDays: 5,
    };

    const result = calculateAccountHealthScore(components);
    expect(result.score).toBeLessThan(50);
    expect(result.status).toBe('CRITICAL');
  });
});

describe('F2.3 Auto-Quarantine', () => {
  let manager: AutoQuarantineManager;

  beforeEach(() => {
    manager = new AutoQuarantineManager({
      quarantineHealthThreshold: 50,
    });
  });

  it('automatically quarantines account when health drops below threshold or reach canary fires', () => {
    const account: FarmerAccount = {
      id: 'acc-quarantine-1',
      username: 'farmer_bot_1',
      healthScore: 42, // < 50
      status: 'ACTIVE',
      assignedCohortIds: ['cohort-us-fitness'],
    };

    const action = manager.evaluateForQuarantine(account, false);
    expect(action.quarantined).toBe(true);
    expect(action.newStatus).toBe('QUARANTINED');
    expect(action.removedFromCohorts).toContain('cohort-us-fitness');
    expect(action.notification).toBeDefined();
    expect(action.notification?.title).toContain('Auto-Quarantined');
  });

  it('allows manual restore from quarantine', () => {
    const restored = manager.restoreFromQuarantine('acc-quarantine-1', 'Operator verified clean manual check');
    expect(restored.status).toBe('ACTIVE');
    expect(restored.restoredAt).toBeDefined();
  });
});

describe('F2.4 Target-Account Canary Monitor', () => {
  it('detects shadow/visibility restriction if posted comment is invisible on re-fetch', () => {
    const monitor = new TargetCanaryMonitor();
    const input: TargetBoostCheckInput = {
      targetUrl: 'https://tiktok.com/@creator/video/12345',
      testCommentId: 'cmt-99',
      reFetchedCommentIds: ['cmt-1', 'cmt-2'], // cmt-99 missing -> invisible
      currentViewVelocity: 10,
      baselineVelocity: 50,
    };

    const check = monitor.evaluateTargetHealth(input);
    expect(check.safeToProceed).toBe(false);
    expect(check.anomalyDetected).toBe('COMMENT_VISIBILITY_DROP');
    expect(check.shouldTripKillSwitch).toBe(true);
  });
});

describe('F2.5 Verification Incident Log', () => {
  it('records incidents and flags proxy cluster for retirement when incident threshold hit', () => {
    const log = new IncidentLogManager({ maxIncidentsPerProxy: 3 });

    log.recordIncident({ accountId: 'acc-1', proxyId: 'prx-cluster-1', type: 'CAPTCHA', details: 'Slider captcha' });
    log.recordIncident({ accountId: 'acc-2', proxyId: 'prx-cluster-1', type: 'PHONE_REVERIFY', details: 'SMS challenge' });
    const res = log.recordIncident({ accountId: 'acc-3', proxyId: 'prx-cluster-1', type: 'LOGIN_CHALLENGE', details: 'Device mismatch' });

    expect(res.proxyRetirementRecommended).toBe(true);
    expect(res.proxyId).toBe('prx-cluster-1');
  });
});
