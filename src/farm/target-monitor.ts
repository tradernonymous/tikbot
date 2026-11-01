export interface TargetBoostCheckInput {
  targetUrl: string;
  testCommentId?: string;
  reFetchedCommentIds?: string[];
  currentViewVelocity: number;
  baselineVelocity: number;
  searchVisibilityIndex?: number;
}

export type TargetAnomalyType =
  | 'COMMENT_VISIBILITY_DROP'
  | 'VELOCITY_COLLAPSE'
  | 'SEARCH_INELIGIBLE';

export interface TargetCanaryCheckResult {
  targetUrl: string;
  safeToProceed: boolean;
  anomalyDetected?: TargetAnomalyType;
  shouldTripKillSwitch: boolean;
  provenance: 'live';
  details?: string;
}

export class TargetCanaryMonitor {
  evaluateTargetHealth(input: TargetBoostCheckInput): TargetCanaryCheckResult {
    // 1. Comment visibility check (if comment was posted but absent on re-fetch)
    if (
      input.testCommentId &&
      input.reFetchedCommentIds &&
      !input.reFetchedCommentIds.includes(input.testCommentId)
    ) {
      return {
        targetUrl: input.targetUrl,
        safeToProceed: false,
        anomalyDetected: 'COMMENT_VISIBILITY_DROP',
        shouldTripKillSwitch: true,
        provenance: 'live',
        details: `Posted comment ID ${input.testCommentId} was not visible on public re-fetch (possible soft filter)`,
      };
    }

    // 2. Velocity collapse check (if view velocity dropped by >70% of baseline during run)
    if (
      input.baselineVelocity > 0 &&
      input.currentViewVelocity < input.baselineVelocity * 0.3
    ) {
      return {
        targetUrl: input.targetUrl,
        safeToProceed: false,
        anomalyDetected: 'VELOCITY_COLLAPSE',
        shouldTripKillSwitch: true,
        provenance: 'live',
        details: `View velocity collapsed below 30% of organic baseline (${input.currentViewVelocity} < ${input.baselineVelocity * 0.3})`,
      };
    }

    return {
      targetUrl: input.targetUrl,
      safeToProceed: true,
      shouldTripKillSwitch: false,
      provenance: 'live',
    };
  }
}
