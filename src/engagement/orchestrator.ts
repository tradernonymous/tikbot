import { AccountRateLimiter, ActionType } from '../farm/rate-limiter';
import { KillSwitchManager, globalKillSwitch } from '../security/kill-switch';

export interface WorkingHoursConfig {
  startHour: number; // e.g. 8 (08:00 UTC)
  endHour: number;   // e.g. 23 (23:00 UTC)
}

export interface ActionRequest {
  accountId: string;
  actionType: ActionType;
  targetUrl: string;
  commentText?: string;
  timestamp?: Date;
  forceOutsideHours?: boolean;
}

export interface ScheduledAction {
  accountId: string;
  actionType: ActionType;
  targetUrl: string;
  scheduledFor: Date;
  commentText?: string;
}

export interface OrchestratorOptions {
  rateLimiter?: AccountRateLimiter;
  killSwitch?: KillSwitchManager;
  workingHours?: WorkingHoursConfig;
}

export class ActionOrchestrator {
  private rateLimiter: AccountRateLimiter;
  private killSwitch: KillSwitchManager;
  private workingHours: WorkingHoursConfig;

  constructor(options: OrchestratorOptions = {}) {
    this.rateLimiter = options.rateLimiter || new AccountRateLimiter();
    this.killSwitch = options.killSwitch || globalKillSwitch;
    this.workingHours = options.workingHours || { startHour: 8, endHour: 23 };
  }

  isWithinWorkingHours(date: Date = new Date()): boolean {
    const hour = date.getUTCHours();
    if (this.workingHours.startHour <= this.workingHours.endHour) {
      return hour >= this.workingHours.startHour && hour < this.workingHours.endHour;
    }
    // Overnight window (e.g., 22:00 to 06:00)
    return hour >= this.workingHours.startHour || hour < this.workingHours.endHour;
  }

  dispatchAction(req: ActionRequest): { allowed: boolean; timestamp: Date } {
    this.killSwitch.assertOperationsPermitted();

    const date = req.timestamp || new Date();
    if (!req.forceOutsideHours && !this.isWithinWorkingHours(date)) {
      throw new Error(`Outside working hours (${this.workingHours.startHour}:00 - ${this.workingHours.endHour}:00 UTC). Action rejected.`);
    }

    const check = this.rateLimiter.canPerformAction(req.accountId, req.actionType, date.getTime());
    if (!check.allowed) {
      throw new Error(check.reason || `Velocity limit exceeded for ${req.actionType}`);
    }

    this.rateLimiter.recordAction(req.accountId, req.actionType, date.getTime());

    return {
      allowed: true,
      timestamp: date,
    };
  }

  buildStaggeredSchedule(params: {
    accountIds: string[];
    actionType: ActionType;
    targetUrl: string;
    baseTime?: Date;
    minIntervalMs?: number;
    maxIntervalMs?: number;
    commentTexts?: string[];
  }): ScheduledAction[] {
    const base = params.baseTime || new Date();
    const minInterval = params.minIntervalMs ?? 15_000;
    const maxInterval = params.maxIntervalMs ?? 45_000;

    let cumulativeOffset = 0;
    return params.accountIds.map((accountId, index) => {
      // Calculate jitter interval
      const jitter = Math.floor(minInterval + Math.random() * (maxInterval - minInterval));
      cumulativeOffset += jitter;
      const scheduledFor = new Date(base.getTime() + cumulativeOffset);

      return {
        accountId,
        actionType: params.actionType,
        targetUrl: params.targetUrl,
        scheduledFor,
        commentText: params.commentTexts ? params.commentTexts[index % params.commentTexts.length] : undefined,
      };
    });
  }
}
