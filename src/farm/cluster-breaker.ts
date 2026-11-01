export interface AccountActionCandidate {
  accountId: string;
  proxySubnet: string;
  fingerprintFamily: string;
  creationBatchId?: string;
}

export interface ClusterConstraintCheckResult {
  allowed: boolean;
  reason?: string;
}

interface ActionRecord {
  accountId: string;
  proxySubnet: string;
  fingerprintFamily: string;
  timestampMs: number;
}

export class ClusterBreakerSolver {
  private windowMinutes: number;
  private actionHistory = new Map<string, ActionRecord[]>(); // targetId -> records[]

  constructor(options: { windowMinutes?: number } = {}) {
    this.windowMinutes = options.windowMinutes ?? 60;
  }

  canPerformAction(
    targetId: string,
    candidate: AccountActionCandidate,
    nowMs = Date.now()
  ): ClusterConstraintCheckResult {
    const history = this.actionHistory.get(targetId) || [];
    const windowStart = nowMs - this.windowMinutes * 60 * 1000;

    const recentActions = history.filter((r) => r.timestampMs >= windowStart);

    // 1. Check Subnet Collision
    const subnetCollision = recentActions.find(
      (r) => r.proxySubnet === candidate.proxySubnet && r.accountId !== candidate.accountId
    );
    if (subnetCollision) {
      return {
        allowed: false,
        reason: `Cluster constraint breached: proxy subnet collision (${candidate.proxySubnet}) with account ${subnetCollision.accountId} within ${this.windowMinutes}m`,
      };
    }

    // 2. Check Fingerprint Family Concentration (max 3 actions from same fingerprint family within window)
    const familyCount = recentActions.filter(
      (r) => r.fingerprintFamily === candidate.fingerprintFamily
    ).length;

    if (familyCount >= 3) {
      return {
        allowed: false,
        reason: `Cluster constraint breached: fingerprint family concentration limit reached (${familyCount}/3 for ${candidate.fingerprintFamily})`,
      };
    }

    return { allowed: true };
  }

  recordAction(
    targetId: string,
    candidate: AccountActionCandidate,
    nowMs = Date.now()
  ): void {
    const list = this.actionHistory.get(targetId) || [];
    list.push({
      accountId: candidate.accountId,
      proxySubnet: candidate.proxySubnet,
      fingerprintFamily: candidate.fingerprintFamily,
      timestampMs: nowMs,
    });
    this.actionHistory.set(targetId, list);
  }
}
