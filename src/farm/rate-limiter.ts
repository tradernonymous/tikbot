export type ActionType = 'VIEW' | 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SAVE' | 'SHARE' | 'LIVE_VIEW';

export interface ActionCapConfig {
  maxPerHour: number;
  maxPerDay: number;
  minJitterMs: number;
  maxJitterMs: number;
}

export const COMPLIANCE_ACTION_CAPS: Record<ActionType, ActionCapConfig> = {
  VIEW: { maxPerHour: 15, maxPerDay: 80, minJitterMs: 15000, maxJitterMs: 45000 },
  LIKE: { maxPerHour: 5, maxPerDay: 25, minJitterMs: 45000, maxJitterMs: 120000 },
  COMMENT: { maxPerHour: 3, maxPerDay: 12, minJitterMs: 120000, maxJitterMs: 300000 },
  FOLLOW: { maxPerHour: 4, maxPerDay: 20, minJitterMs: 60000, maxJitterMs: 180000 },
  SAVE: { maxPerHour: 4, maxPerDay: 15, minJitterMs: 60000, maxJitterMs: 180000 },
  SHARE: { maxPerHour: 4, maxPerDay: 15, minJitterMs: 60000, maxJitterMs: 180000 },
  LIVE_VIEW: { maxPerHour: 1, maxPerDay: 2, minJitterMs: 30000, maxJitterMs: 90000 },
};

export function calculateHumanJitterDelay(action: ActionType): number {
  const cap = COMPLIANCE_ACTION_CAPS[action] || COMPLIANCE_ACTION_CAPS.VIEW;
  const range = cap.maxJitterMs - cap.minJitterMs;
  return Math.floor(cap.minJitterMs + Math.random() * range);
}

export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  hourlyCount: number;
  dailyCount: number;
}

export class AccountRateLimiter {
  // Map<`${accountId}:${actionType}`, timestamp[]>
  private actionTimestamps = new Map<string, number[]>();

  recordAction(accountId: string, action: ActionType, timestamp = Date.now()): void {
    const key = `${accountId}:${action}`;
    const list = this.actionTimestamps.get(key) || [];
    list.push(timestamp);
    this.actionTimestamps.set(key, list);
  }

  canPerformAction(accountId: string, action: ActionType, now = Date.now()): VelocityCheckResult {
    const key = `${accountId}:${action}`;
    const allTimestamps = this.actionTimestamps.get(key) || [];
    const cap = COMPLIANCE_ACTION_CAPS[action];

    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const hourlyCount = allTimestamps.filter((t) => t > oneHourAgo).length;
    const dailyCount = allTimestamps.filter((t) => t > oneDayAgo).length;

    if (hourlyCount >= cap.maxPerHour) {
      return {
        allowed: false,
        reason: `Hourly cap exceeded for ${action} (${hourlyCount}/${cap.maxPerHour})`,
        hourlyCount,
        dailyCount,
      };
    }

    if (dailyCount >= cap.maxPerDay) {
      return {
        allowed: false,
        reason: `Daily cap exceeded for ${action} (${dailyCount}/${cap.maxPerDay})`,
        hourlyCount,
        dailyCount,
      };
    }

    return {
      allowed: true,
      hourlyCount,
      dailyCount,
    };
  }

  resetAccount(accountId: string): void {
    for (const key of this.actionTimestamps.keys()) {
      if (key.startsWith(`${accountId}:`)) {
        this.actionTimestamps.delete(key);
      }
    }
  }
}
