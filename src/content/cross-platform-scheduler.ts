export type TargetPlatform = 'TIKTOK' | 'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS';

export interface ScheduledPostEntry {
  id: string;
  accountId: string;
  platform: TargetPlatform;
  scheduledFor: Date;
}

export interface ScheduleSlotValidationInput {
  accountId: string;
  platform: TargetPlatform;
  requestedTime: Date;
  existingPosts: ScheduledPostEntry[];
}

export interface ScheduleSlotResult {
  allowed: boolean;
  conflictDetected: boolean;
  reason?: string;
}

export interface CrossPlatformSchedulerConfig {
  dailyCaps?: Record<TargetPlatform, number>;
  minSlotIntervalMinutes?: number;
}

export class CrossPlatformScheduler {
  private dailyCaps: Record<TargetPlatform, number>;
  private minSlotIntervalMinutes: number;

  constructor(config: CrossPlatformSchedulerConfig = {}) {
    this.dailyCaps = config.dailyCaps ?? {
      TIKTOK: 4,
      YOUTUBE_SHORTS: 3,
      INSTAGRAM_REELS: 2,
    };
    this.minSlotIntervalMinutes = config.minSlotIntervalMinutes ?? 30;
  }

  validateScheduleSlot(input: ScheduleSlotValidationInput): ScheduleSlotResult {
    const requestedDateStr = input.requestedTime.toISOString().slice(0, 10);

    // 1. Check daily platform caps for this account
    const postsOnSameDay = input.existingPosts.filter((p) => {
      return (
        p.accountId === input.accountId &&
        p.platform === input.platform &&
        p.scheduledFor.toISOString().slice(0, 10) === requestedDateStr
      );
    });

    const cap = this.dailyCaps[input.platform] ?? 3;
    if (postsOnSameDay.length >= cap) {
      return {
        allowed: false,
        conflictDetected: false,
        reason: `Daily cap reached for ${input.platform} (${postsOnSameDay.length}/${cap})`,
      };
    }

    // 2. Check collision interval with any post for same account
    const minSpacingMs = this.minSlotIntervalMinutes * 60 * 1000;
    const reqMs = input.requestedTime.getTime();

    for (const post of input.existingPosts) {
      if (post.accountId === input.accountId) {
        const postMs = post.scheduledFor.getTime();
        const diff = Math.abs(reqMs - postMs);
        if (diff < minSpacingMs) {
          return {
            allowed: false,
            conflictDetected: true,
            reason: `Conflict: minimum ${this.minSlotIntervalMinutes} min spacing required with post at ${post.scheduledFor.toISOString()}`,
          };
        }
      }
    }

    return {
      allowed: true,
      conflictDetected: false,
    };
  }

  findNextAvailableSlot(params: {
    accountId: string;
    platform: TargetPlatform;
    baseTime: Date;
    existingPosts: ScheduledPostEntry[];
  }): Date {
    let candidate = new Date(params.baseTime.getTime());
    const stepMs = this.minSlotIntervalMinutes * 60 * 1000;

    for (let i = 0; i < 48; i++) {
      const check = this.validateScheduleSlot({
        accountId: params.accountId,
        platform: params.platform,
        requestedTime: candidate,
        existingPosts: params.existingPosts,
      });

      if (check.allowed) {
        return candidate;
      }

      candidate = new Date(candidate.getTime() + stepMs);
    }

    return candidate;
  }
}
