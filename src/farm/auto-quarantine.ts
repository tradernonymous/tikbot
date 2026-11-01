export interface FarmerAccount {
  id: string;
  username: string;
  healthScore: number;
  status: 'ACTIVE' | 'QUARANTINED' | 'BANNED';
  assignedCohortIds: string[];
}

export interface QuarantineNotification {
  type: 'AUTO_QUARANTINE';
  title: string;
  body: string;
  provenance: 'live';
  occurredAt: string;
}

export interface QuarantineEvaluationResult {
  accountId: string;
  quarantined: boolean;
  newStatus: 'ACTIVE' | 'QUARANTINED';
  removedFromCohorts: string[];
  reason?: string;
  notification?: QuarantineNotification;
}

export interface RestoredAccountResult {
  accountId: string;
  status: 'ACTIVE';
  restoredAt: string;
  operatorNotes: string;
}

export class AutoQuarantineManager {
  private quarantineHealthThreshold: number;
  private quarantinedAccounts = new Map<string, FarmerAccount>();

  constructor(options: { quarantineHealthThreshold?: number } = {}) {
    this.quarantineHealthThreshold = options.quarantineHealthThreshold ?? 50;
  }

  evaluateForQuarantine(
    account: FarmerAccount,
    reachCanaryFired: boolean
  ): QuarantineEvaluationResult {
    const shouldQuarantine =
      account.healthScore < this.quarantineHealthThreshold || reachCanaryFired;

    if (!shouldQuarantine) {
      return {
        accountId: account.id,
        quarantined: false,
        newStatus: 'ACTIVE',
        removedFromCohorts: [],
      };
    }

    const removedCohorts = [...account.assignedCohortIds];
    account.status = 'QUARANTINED';
    account.assignedCohortIds = [];
    this.quarantinedAccounts.set(account.id, account);

    const reason = reachCanaryFired
      ? 'Reach canary breach (organic discovery drop)'
      : `Health score below threshold (${account.healthScore} < ${this.quarantineHealthThreshold})`;

    return {
      accountId: account.id,
      quarantined: true,
      newStatus: 'QUARANTINED',
      removedFromCohorts: removedCohorts,
      reason,
      notification: {
        type: 'AUTO_QUARANTINE',
        title: `Account @${account.username} Auto-Quarantined`,
        body: `Farmer account was pulled from ${removedCohorts.length} boost cohort(s). Reason: ${reason}.`,
        provenance: 'live',
        occurredAt: new Date().toISOString(),
      },
    };
  }

  restoreFromQuarantine(accountId: string, operatorNotes: string): RestoredAccountResult {
    const existing = this.quarantinedAccounts.get(accountId);
    if (existing) {
      existing.status = 'ACTIVE';
    }
    return {
      accountId,
      status: 'ACTIVE',
      restoredAt: new Date().toISOString(),
      operatorNotes,
    };
  }
}
