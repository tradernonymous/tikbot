export type WatchlistType = 'CREATOR' | 'HASHTAG' | 'SOUND' | 'KEYWORD';

export interface WatchlistTarget {
  id: string;
  type: WatchlistType;
  identifier: string; // e.g. handle or hashtag string
  intervalHours: number;
  enabled: boolean;
  lastPolledAt?: Date;
  nextPollAt?: Date;
  consecutiveFailures?: number;
  lastError?: string;
}

export class WatchlistScheduler {
  private targets = new Map<string, WatchlistTarget>();

  addTarget(target: WatchlistTarget): WatchlistTarget {
    const initialized: WatchlistTarget = {
      ...target,
      consecutiveFailures: target.consecutiveFailures ?? 0,
      nextPollAt: target.nextPollAt ?? new Date(),
    };
    this.targets.set(target.id, initialized);
    return { ...initialized };
  }

  getTarget(id: string): WatchlistTarget | undefined {
    const t = this.targets.get(id);
    return t ? { ...t } : undefined;
  }

  getDueTargets(now = new Date()): WatchlistTarget[] {
    const due: WatchlistTarget[] = [];
    for (const t of this.targets.values()) {
      if (t.enabled && t.nextPollAt && t.nextPollAt <= now) {
        due.push({ ...t });
      }
    }
    return due;
  }

  recordPollSuccess(targetId: string, customNextPollAt?: Date): void {
    const t = this.targets.get(targetId);
    if (!t) return;

    const now = new Date();
    const nextPoll =
      customNextPollAt ?? new Date(now.getTime() + t.intervalHours * 3600 * 1000);

    this.targets.set(targetId, {
      ...t,
      lastPolledAt: now,
      nextPollAt: nextPoll,
      consecutiveFailures: 0,
      lastError: undefined,
    });
  }

  recordPollFailure(targetId: string, error: string): void {
    const t = this.targets.get(targetId);
    if (!t) return;

    this.targets.set(targetId, {
      ...t,
      consecutiveFailures: (t.consecutiveFailures ?? 0) + 1,
      lastError: error,
    });
  }
}
