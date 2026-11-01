export interface ViewSample {
  views: number;
  sampledAt: string;
}

export interface CanaryEvaluationResult {
  accountId: string;
  status: 'HEALTHY' | 'REACH_DROP';
  reachDropDetected: boolean;
  consecutiveBreaches: number;
  currentViews: number;
  baselineMedian: number;
  baselineThreshold: number;
  provenance: 'live' | 'stale';
}

export function computeMedianAndMad(numbers: number[]): { median: number; mad: number } {
  if (numbers.length === 0) return { median: 0, mad: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const deviations = sorted.map((n) => Math.abs(n - median)).sort((a, b) => a - b);
  const mad =
    deviations.length % 2 !== 0
      ? deviations[mid]
      : (deviations[mid - 1] + deviations[mid]) / 2;

  return { median, mad };
}

export class ReachCanaryDetector {
  private consecutiveBreachesRequired: number;
  private breachTracker = new Map<string, number>(); // accountId -> consecutive count

  constructor(config: { consecutiveBreachesRequired?: number } = {}) {
    this.consecutiveBreachesRequired = config.consecutiveBreachesRequired ?? 2;
  }

  evaluatePostViews(
    accountId: string,
    currentViews: number,
    history: number[]
  ): CanaryEvaluationResult {
    const { median, mad } = computeMedianAndMad(history);
    const threshold = Math.max(0, median - mad);

    const isBreach = currentViews < threshold;
    let currentBreaches = this.breachTracker.get(accountId) || 0;

    if (isBreach) {
      currentBreaches += 1;
    } else {
      currentBreaches = 0;
    }

    this.breachTracker.set(accountId, currentBreaches);

    const reachDropDetected = currentBreaches >= this.consecutiveBreachesRequired;

    return {
      accountId,
      status: reachDropDetected ? 'REACH_DROP' : 'HEALTHY',
      reachDropDetected,
      consecutiveBreaches: currentBreaches,
      currentViews,
      baselineMedian: median,
      baselineThreshold: threshold,
      provenance: 'live',
    };
  }

  reset(accountId: string): void {
    this.breachTracker.delete(accountId);
  }
}
