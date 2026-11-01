import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdaptivePacingEngine,
  type AccountPacingSignals,
  type PacingStatus,
} from '../adaptive-pacing';

describe('H5.1 Adaptive Pacing Engine', () => {
  let engine: AdaptivePacingEngine;

  beforeEach(() => {
    engine = new AdaptivePacingEngine({
      baseBudgetPerHour: 60,
      captchaWarningThreshold: 0.05,
      captchaCriticalThreshold: 0.15,
      reachDropThreshold: 0.4,
    });
  });

  it('provides full budget under normal healthy conditions', () => {
    const signals: AccountPacingSignals = {
      accountId: 'acc-1',
      totalActionsLastHour: 30,
      captchaChallengesLastHour: 0,
      recentReachDropPercentage: 0.05,
      consecutiveErrors: 0,
    };

    const status = engine.evaluatePacing(signals);
    expect(status.status).toBe('NORMAL');
    expect(status.throttleMultiplier).toBe(1.0);
    expect(status.adjustedHourlyBudget).toBe(60);
    expect(status.allowNewAction).toBe(true);
  });

  it('throttles budget when captcha rate enters warning range', () => {
    const signals: AccountPacingSignals = {
      accountId: 'acc-2',
      totalActionsLastHour: 50,
      captchaChallengesLastHour: 4, // 4/50 = 8% > 5% warning
      recentReachDropPercentage: 0.1,
      consecutiveErrors: 1,
    };

    const status = engine.evaluatePacing(signals);
    expect(status.status).toBe('THROTTLED');
    expect(status.throttleMultiplier).toBeLessThan(1.0);
    expect(status.throttleMultiplier).toBeGreaterThanOrEqual(0.4);
    expect(status.adjustedHourlyBudget).toBeLessThan(60);
  });

  it('severely restricts budget when reach drops precipitously', () => {
    const signals: AccountPacingSignals = {
      accountId: 'acc-3',
      totalActionsLastHour: 20,
      captchaChallengesLastHour: 1,
      recentReachDropPercentage: 0.65, // 65% drop > 40% threshold
      consecutiveErrors: 0,
    };

    const status = engine.evaluatePacing(signals);
    expect(status.status).toBe('RESTRICTED');
    expect(status.throttleMultiplier).toBeLessThanOrEqual(0.3);
  });

  it('enters COOLING_OFF and blocks new actions when critical captcha threshold or high errors hit', () => {
    const signals: AccountPacingSignals = {
      accountId: 'acc-4',
      totalActionsLastHour: 30,
      captchaChallengesLastHour: 6, // 6/30 = 20% > 15% critical
      recentReachDropPercentage: 0.2,
      consecutiveErrors: 4,
    };

    const status = engine.evaluatePacing(signals);
    expect(status.status).toBe('COOLING_OFF');
    expect(status.allowNewAction).toBe(false);
    expect(status.coolingOffMinutesRemaining).toBeGreaterThan(0);

    // Subsequent check within cooloff period still blocks
    const secondCheck = engine.evaluatePacing(signals);
    expect(secondCheck.status).toBe('COOLING_OFF');
    expect(secondCheck.allowNewAction).toBe(false);
  });

  it('resets or recovers when signals normalize', () => {
    engine.recordActionOutcome('acc-5', 'SUCCESS');
    engine.recordActionOutcome('acc-5', 'CAPTCHA');
    engine.recordActionOutcome('acc-5', 'ERROR');
    const signals = engine.getSignals('acc-5');
    expect(signals.totalActionsLastHour).toBe(3);
    expect(signals.captchaChallengesLastHour).toBe(1);
    expect(signals.consecutiveErrors).toBe(2);

    engine.resetSignals('acc-5');
    const reset = engine.getSignals('acc-5');
    expect(reset.totalActionsLastHour).toBe(0);
  });
});
