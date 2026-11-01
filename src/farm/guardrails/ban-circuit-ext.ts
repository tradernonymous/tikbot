export interface CohortCanarySignal {
  cohortId: string;
  totalMembers: number;
  membersBreachedReachCanary: number;
  reachDropRatio: number; // breached / total
}

export interface CircuitEvaluationResult {
  cohortId: string;
  tripGlobalCircuitBreaker: boolean;
  quarantineCascadeThrottled: boolean;
  reason?: string;
}

export class FarmBanCircuitExtender {
  private cascadeThresholdRatio: number;

  constructor(options: { cascadeThresholdRatio?: number } = {}) {
    this.cascadeThresholdRatio = options.cascadeThresholdRatio ?? 0.3; // 30% of cohort
  }

  evaluateCohortCanary(signal: CohortCanarySignal): CircuitEvaluationResult {
    const ratio =
      signal.totalMembers > 0
        ? signal.membersBreachedReachCanary / signal.totalMembers
        : 0;

    if (ratio >= this.cascadeThresholdRatio) {
      return {
        cohortId: signal.cohortId,
        tripGlobalCircuitBreaker: true,
        quarantineCascadeThrottled: true,
        reason: `Cohort-wide reach canary breach (${(ratio * 100).toFixed(1)}% >= ${(this.cascadeThresholdRatio * 100).toFixed(0)}%). Pausing farm operations.`,
      };
    }

    return {
      cohortId: signal.cohortId,
      tripGlobalCircuitBreaker: false,
      quarantineCascadeThrottled: false,
    };
  }
}
