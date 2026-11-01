export type ProxyOperationalStatus = 'ACTIVE' | 'DEGRADED' | 'RETIRED';

export interface ProxyHealthRecord {
  proxyId: string;
  totalRequests: number;
  successfulRequests: number;
  averageLatencyMs: number;
  bansAssociated: number;
  captchasAssociated: number;
  consecutiveFailures: number;
  status: ProxyOperationalStatus;
}

export interface ProxyHealthEvaluation {
  proxyId: string;
  score: number; // 0 to 100
  isHealthy: boolean;
  recommendRetirement: boolean;
  status: ProxyOperationalStatus;
  reasons: string[];
}

export interface ProxyAssignment {
  accountId: string;
  proxyId: string;
}

export interface RebalanceAssignmentResult {
  accountId: string;
  previousProxyId: string;
  newProxyId: string;
}

export interface PoolRebalanceSummary {
  retiredProxyIds: string[];
  reassigned: RebalanceAssignmentResult[];
  activePoolCount: number;
}

export interface ProxyHealthConfig {
  retirementScoreThreshold?: number; // default 40
  consecutiveFailureLimit?: number; // default 5
  maxLatencyMsThreshold?: number; // default 2000
}

export class ProxyHealthScorer {
  private config: Required<ProxyHealthConfig>;

  constructor(config: ProxyHealthConfig = {}) {
    this.config = {
      retirementScoreThreshold: config.retirementScoreThreshold ?? 40,
      consecutiveFailureLimit: config.consecutiveFailureLimit ?? 5,
      maxLatencyMsThreshold: config.maxLatencyMsThreshold ?? 2000,
    };
  }

  evaluateProxy(record: ProxyHealthRecord): ProxyHealthEvaluation {
    const reasons: string[] = [];

    // Success rate component (40 pts max)
    const successRate =
      record.totalRequests > 0
        ? record.successfulRequests / record.totalRequests
        : 1.0;
    const successPoints = Math.round(successRate * 40);

    // Latency component (20 pts max)
    const latencyPenalty = Math.min(20, Math.floor(record.averageLatencyMs / 100));
    const latencyPoints = Math.max(0, 20 - latencyPenalty);

    // Ban / Challenge penalty (40 pts max)
    const banPenalty = record.bansAssociated * 20;
    const captchaPenalty = record.captchasAssociated * 5;
    const securityPoints = Math.max(0, 40 - banPenalty - captchaPenalty);

    let score = successPoints + latencyPoints + securityPoints;
    score = Math.max(0, Math.min(100, score));

    let recommendRetirement = false;
    let status: ProxyOperationalStatus = 'ACTIVE';

    if (record.consecutiveFailures >= this.config.consecutiveFailureLimit) {
      recommendRetirement = true;
      reasons.push(
        `Consecutive failure limit exceeded (${record.consecutiveFailures} >= ${this.config.consecutiveFailureLimit})`
      );
    }

    if (score < this.config.retirementScoreThreshold) {
      recommendRetirement = true;
      reasons.push(
        `Score below threshold (${score} < ${this.config.retirementScoreThreshold})`
      );
    }

    if (record.bansAssociated >= 2) {
      recommendRetirement = true;
      reasons.push(`Multiple account bans associated with proxy (${record.bansAssociated})`);
    }

    if (recommendRetirement) {
      status = 'RETIRED';
    } else if (score < 70 || record.consecutiveFailures >= 2) {
      status = 'DEGRADED';
    }

    return {
      proxyId: record.proxyId,
      score,
      isHealthy: status === 'ACTIVE' && score >= 70 && !recommendRetirement,
      recommendRetirement,
      status,
      reasons,
    };
  }

  rebalancePool(
    proxies: ProxyHealthRecord[],
    currentAssignments: ProxyAssignment[]
  ): PoolRebalanceSummary {
    const evaluations = proxies.map((p) => this.evaluateProxy(p));
    const retiredProxyIds = evaluations
      .filter((e) => e.recommendRetirement)
      .map((e) => e.proxyId);

    const healthyProxies = evaluations
      .filter((e) => !e.recommendRetirement)
      .sort((a, b) => b.score - a.score);

    const reassigned: RebalanceAssignmentResult[] = [];

    if (healthyProxies.length === 0) {
      return {
        retiredProxyIds,
        reassigned: [],
        activePoolCount: 0,
      };
    }

    let healthyIndex = 0;
    for (const assignment of currentAssignments) {
      if (retiredProxyIds.includes(assignment.proxyId)) {
        const replacement = healthyProxies[healthyIndex % healthyProxies.length];
        healthyIndex++;

        reassigned.push({
          accountId: assignment.accountId,
          previousProxyId: assignment.proxyId,
          newProxyId: replacement.proxyId,
        });
      }
    }

    return {
      retiredProxyIds,
      reassigned,
      activePoolCount: healthyProxies.length,
    };
  }
}
