export type PacingStatus = 'NORMAL' | 'THROTTLED' | 'RESTRICTED' | 'COOLING_OFF';

export interface AccountPacingSignals {
  accountId: string;
  totalActionsLastHour: number;
  captchaChallengesLastHour: number;
  recentReachDropPercentage: number;
  consecutiveErrors: number;
}

export interface PacingEvaluationResult {
  accountId: string;
  status: PacingStatus;
  throttleMultiplier: number;
  adjustedHourlyBudget: number;
  allowNewAction: boolean;
  coolingOffMinutesRemaining?: number;
  reason?: string;
}

export interface AdaptivePacingConfig {
  baseBudgetPerHour: number;
  captchaWarningThreshold: number; // e.g., 0.05 (5%)
  captchaCriticalThreshold: number; // e.g., 0.15 (15%)
  reachDropThreshold: number; // e.g., 0.40 (40%)
  coolingOffDurationMinutes?: number;
}

export class AdaptivePacingEngine {
  private config: Required<AdaptivePacingConfig>;
  private signalsStore = new Map<string, AccountPacingSignals>();
  private coolingOffUntil = new Map<string, number>();

  constructor(config: AdaptivePacingConfig) {
    this.config = {
      baseBudgetPerHour: config.baseBudgetPerHour,
      captchaWarningThreshold: config.captchaWarningThreshold,
      captchaCriticalThreshold: config.captchaCriticalThreshold,
      reachDropThreshold: config.reachDropThreshold,
      coolingOffDurationMinutes: config.coolingOffDurationMinutes ?? 30,
    };
  }

  evaluatePacing(signals: AccountPacingSignals): PacingEvaluationResult {
    const now = Date.now();
    const coolOffExpires = this.coolingOffUntil.get(signals.accountId);

    if (coolOffExpires && coolOffExpires > now) {
      const minutesRemaining = Math.ceil((coolOffExpires - now) / 60000);
      return {
        accountId: signals.accountId,
        status: 'COOLING_OFF',
        throttleMultiplier: 0,
        adjustedHourlyBudget: 0,
        allowNewAction: false,
        coolingOffMinutesRemaining: minutesRemaining,
        reason: 'Account is in mandatory cool-off period',
      };
    }

    const total = Math.max(1, signals.totalActionsLastHour);
    const captchaRate = signals.captchaChallengesLastHour / total;

    // Check critical thresholds
    if (
      captchaRate >= this.config.captchaCriticalThreshold ||
      signals.consecutiveErrors >= 3
    ) {
      const coolOffEnd = now + this.config.coolingOffDurationMinutes * 60000;
      this.coolingOffUntil.set(signals.accountId, coolOffEnd);
      return {
        accountId: signals.accountId,
        status: 'COOLING_OFF',
        throttleMultiplier: 0,
        adjustedHourlyBudget: 0,
        allowNewAction: false,
        coolingOffMinutesRemaining: this.config.coolingOffDurationMinutes,
        reason: `Critical safety limit hit (captchaRate: ${(captchaRate * 100).toFixed(1)}%, errors: ${signals.consecutiveErrors})`,
      };
    }

    // Check reach drop restriction
    if (signals.recentReachDropPercentage >= this.config.reachDropThreshold) {
      const multiplier = 0.25;
      return {
        accountId: signals.accountId,
        status: 'RESTRICTED',
        throttleMultiplier: multiplier,
        adjustedHourlyBudget: Math.floor(this.config.baseBudgetPerHour * multiplier),
        allowNewAction: true,
        reason: `Severe organic reach drop detected (${(signals.recentReachDropPercentage * 100).toFixed(1)}%)`,
      };
    }

    // Check captcha warning throttling
    if (captchaRate >= this.config.captchaWarningThreshold) {
      const multiplier = 0.5;
      return {
        accountId: signals.accountId,
        status: 'THROTTLED',
        throttleMultiplier: multiplier,
        adjustedHourlyBudget: Math.floor(this.config.baseBudgetPerHour * multiplier),
        allowNewAction: true,
        reason: `Elevated captcha frequency (${(captchaRate * 100).toFixed(1)}%)`,
      };
    }

    return {
      accountId: signals.accountId,
      status: 'NORMAL',
      throttleMultiplier: 1.0,
      adjustedHourlyBudget: this.config.baseBudgetPerHour,
      allowNewAction: true,
    };
  }

  recordActionOutcome(accountId: string, outcome: 'SUCCESS' | 'CAPTCHA' | 'ERROR'): void {
    const current = this.getSignals(accountId);
    current.totalActionsLastHour += 1;
    if (outcome === 'CAPTCHA') {
      current.captchaChallengesLastHour += 1;
      current.consecutiveErrors += 1;
    } else if (outcome === 'ERROR') {
      current.consecutiveErrors += 1;
    } else {
      current.consecutiveErrors = 0;
    }
    this.signalsStore.set(accountId, current);
  }

  getSignals(accountId: string): AccountPacingSignals {
    return (
      this.signalsStore.get(accountId) || {
        accountId,
        totalActionsLastHour: 0,
        captchaChallengesLastHour: 0,
        recentReachDropPercentage: 0,
        consecutiveErrors: 0,
      }
    );
  }

  resetSignals(accountId: string): void {
    this.signalsStore.delete(accountId);
    this.coolingOffUntil.delete(accountId);
  }
}
