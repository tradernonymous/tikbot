import { ActionType } from '../farm/rate-limiter';

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED';

export class UnauthorizedCampaignExecutionError extends Error {
  constructor(message: string) {
    super(`Compliance Violation: ${message}`);
    this.name = 'UnauthorizedCampaignExecutionError';
  }
}

export interface CampaignDefinition {
  id: string;
  title: string;
  targetUrl: string;
  actionType: ActionType;
  targetCount: number;
}

export class CampaignManager {
  private status: CampaignStatus;
  private approvalNotes?: string;
  private approvedBy?: string;
  private executedCount = 0;

  constructor(public readonly def: CampaignDefinition, initialStatus: CampaignStatus = 'PENDING_APPROVAL') {
    this.status = initialStatus;
  }

  getStatus(): CampaignStatus {
    return this.status;
  }

  approve(operatorId: string, notes?: string): void {
    this.status = 'APPROVED';
    this.approvedBy = operatorId;
    this.approvalNotes = notes;
  }

  reject(operatorId: string, notes?: string): void {
    this.status = 'REJECTED';
    this.approvedBy = operatorId;
    this.approvalNotes = notes;
  }

  startExecution(): void {
    if (this.status !== 'APPROVED' && this.status !== 'PAUSED') {
      throw new UnauthorizedCampaignExecutionError(
        `Campaign cannot run with status "${this.status}". Explicit manual approval required.`
      );
    }
    this.status = 'RUNNING';
  }

  pause(reason?: string): void {
    this.status = 'PAUSED';
    if (reason) {
      this.approvalNotes = reason;
    }
  }

  incrementProgress(): void {
    this.executedCount += 1;
    if (this.executedCount >= this.def.targetCount) {
      this.status = 'COMPLETED';
    }
  }

  getProgress(): { executed: number; target: number } {
    return {
      executed: this.executedCount,
      target: this.def.targetCount,
    };
  }
}
