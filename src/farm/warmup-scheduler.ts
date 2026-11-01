export type WarmupActionType = 'VIEW' | 'LIKE' | 'FOLLOW' | 'COMMENT';

export class WarmupGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WarmupGateError';
  }
}

export interface WarmupCheckParams {
  accountId: string;
  warmupDay: number;
  actionType: WarmupActionType;
  currentDayCounts: Record<WarmupActionType, number>;
  graduated?: boolean;
}

export interface WarmupGateResult {
  allowed: boolean;
  reason?: string;
  maxDailyAllowed?: number;
}

interface DayAllowance {
  targetViews: number;
  targetLikes: number;
  targetFollows: number;
  targetComments: number;
}

const WARMUP_LIMITS: Record<number, DayAllowance> = {
  1: { targetViews: 10, targetLikes: 0, targetFollows: 0, targetComments: 0 },
  2: { targetViews: 20, targetLikes: 0, targetFollows: 2, targetComments: 0 },
  3: { targetViews: 35, targetLikes: 5, targetFollows: 3, targetComments: 0 },
  4: { targetViews: 50, targetLikes: 8, targetFollows: 5, targetComments: 0 },
  5: { targetViews: 65, targetLikes: 12, targetFollows: 8, targetComments: 2 },
  6: { targetViews: 75, targetLikes: 18, targetFollows: 12, targetComments: 5 },
  7: { targetViews: 80, targetLikes: 25, targetFollows: 15, targetComments: 8 },
};

export class WarmupScheduler {
  checkActionAllowed(params: WarmupCheckParams): WarmupGateResult {
    if (params.graduated || params.warmupDay >= 7 && params.graduated) {
      return { allowed: true };
    }

    const day = Math.max(1, Math.min(7, params.warmupDay));
    const limits = WARMUP_LIMITS[day];

    let maxAllowed = 0;
    let allowedFromDay = 1;

    switch (params.actionType) {
      case 'VIEW':
        maxAllowed = limits.targetViews;
        allowedFromDay = 1;
        break;
      case 'LIKE':
        maxAllowed = limits.targetLikes;
        allowedFromDay = 3;
        break;
      case 'FOLLOW':
        maxAllowed = limits.targetFollows;
        allowedFromDay = 2;
        break;
      case 'COMMENT':
        maxAllowed = limits.targetComments;
        allowedFromDay = 5;
        break;
    }

    if (maxAllowed === 0) {
      return {
        allowed: false,
        reason: `Action ${params.actionType} not permitted on warmup day ${day} (allowed from day ${allowedFromDay})`,
        maxDailyAllowed: 0,
      };
    }

    const currentCount = params.currentDayCounts[params.actionType] ?? 0;
    if (currentCount >= maxAllowed) {
      return {
        allowed: false,
        reason: `Daily limit reached for ${params.actionType} on warmup day ${day} (${currentCount}/${maxAllowed})`,
        maxDailyAllowed: maxAllowed,
      };
    }

    return {
      allowed: true,
      maxDailyAllowed: maxAllowed,
    };
  }

  assertActionAllowed(params: WarmupCheckParams): void {
    const result = this.checkActionAllowed(params);
    if (!result.allowed) {
      throw new WarmupGateError(
        result.reason ?? `Action ${params.actionType} gated by warmup policy`
      );
    }
  }
}
