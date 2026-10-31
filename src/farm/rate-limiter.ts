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

  recordAction(
    accountId: string,
    action: ActionType,
    timestamp = Date.now()
  ): Promise<void> & { accountId: string } {
    const key = `${accountId}:${action}`;
    const list = this.actionTimestamps.get(key) || [];
    list.push(timestamp);
    this.actionTimestamps.set(key, list);

    const asyncPromise = (async () => {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.accountActionLedger.create({
          data: {
            accountId,
            actionType: action,
            timestamp: new Date(timestamp),
          },
        });
      } catch {
        // Fallback to in-memory tracking
      }
    })();

    return Object.assign(asyncPromise, { accountId });
  }

  canPerformAction(
    accountId: string,
    action: ActionType,
    now = Date.now()
  ): VelocityCheckResult & Promise<VelocityCheckResult> {
    const cap = COMPLIANCE_ACTION_CAPS[action];
    if (!cap) {
      const syncUnknown: VelocityCheckResult = {
        allowed: false,
        reason: 'unknown action',
        hourlyCount: 0,
        dailyCount: 0,
      };
      const p = Promise.resolve(syncUnknown);
      return Object.assign(p, syncUnknown);
    }

    const key = `${accountId}:${action}`;
    const allTimestamps = this.actionTimestamps.get(key) || [];

    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const hourlyCount = allTimestamps.filter((t) => t > oneHourAgo).length;
    const dailyCount = allTimestamps.filter((t) => t > oneDayAgo).length;

    let syncAllowed = true;
    let syncReason: string | undefined;

    if (hourlyCount >= cap.maxPerHour) {
      syncAllowed = false;
      syncReason = `Hourly cap exceeded for ${action} (${hourlyCount}/${cap.maxPerHour})`;
    } else if (dailyCount >= cap.maxPerDay) {
      syncAllowed = false;
      syncReason = `Daily cap exceeded for ${action} (${dailyCount}/${cap.maxPerDay})`;
    }

    const syncRes: VelocityCheckResult = {
      allowed: syncAllowed,
      reason: syncReason,
      hourlyCount,
      dailyCount,
    };

    const asyncPromise = (async () => {
      try {
        const { prisma } = await import('@/lib/prisma');
        const dbHourly = await prisma.accountActionLedger.count({
          where: {
            accountId,
            actionType: action,
            timestamp: { gte: new Date(oneHourAgo) },
          },
        });
        const dbDaily = await prisma.accountActionLedger.count({
          where: {
            accountId,
            actionType: action,
            timestamp: { gte: new Date(oneDayAgo) },
          },
        });

        const effectiveHourly = Math.max(hourlyCount, dbHourly);
        const effectiveDaily = Math.max(dailyCount, dbDaily);

        if (effectiveHourly >= cap.maxPerHour) {
          return {
            allowed: false,
            reason: `Hourly cap exceeded for ${action} (${effectiveHourly}/${cap.maxPerHour})`,
            hourlyCount: effectiveHourly,
            dailyCount: effectiveDaily,
          };
        }

        if (effectiveDaily >= cap.maxPerDay) {
          return {
            allowed: false,
            reason: `Daily cap exceeded for ${action} (${effectiveDaily}/${cap.maxPerDay})`,
            hourlyCount: effectiveHourly,
            dailyCount: effectiveDaily,
          };
        }

        return {
          allowed: true,
          hourlyCount: effectiveHourly,
          dailyCount: effectiveDaily,
        };
      } catch {
        return syncRes;
      }
    })();

    return Object.assign(asyncPromise, syncRes);
  }

  resetAccount(accountId: string): Promise<void> & { accountId: string } {
    for (const key of this.actionTimestamps.keys()) {
      if (key.startsWith(`${accountId}:`)) {
        this.actionTimestamps.delete(key);
      }
    }

    const asyncPromise = (async () => {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.accountActionLedger.deleteMany({
          where: { accountId },
        });
      } catch {
        // Fallback to in-memory tracking
      }
    })();

    return Object.assign(asyncPromise, { accountId });
  }
}

export const globalAccountRateLimiter = new AccountRateLimiter();
