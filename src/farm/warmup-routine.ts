export interface WarmupDayPlan {
  day: number;
  targetViews: number;
  targetLikes: number;
  targetFollows: number;
  targetComments: number;
  profileSetupRequired: boolean;
  graduated: boolean;
}

const WARMUP_SCHEDULE: Record<number, Omit<WarmupDayPlan, 'day'>> = {
  1: { targetViews: 10, targetLikes: 0, targetFollows: 0, targetComments: 0, profileSetupRequired: true, graduated: false },
  2: { targetViews: 20, targetLikes: 0, targetFollows: 2, targetComments: 0, profileSetupRequired: false, graduated: false },
  3: { targetViews: 35, targetLikes: 5, targetFollows: 3, targetComments: 0, profileSetupRequired: false, graduated: false },
  4: { targetViews: 50, targetLikes: 8, targetFollows: 5, targetComments: 0, profileSetupRequired: false, graduated: false },
  5: { targetViews: 65, targetLikes: 12, targetFollows: 8, targetComments: 2, profileSetupRequired: false, graduated: false },
  6: { targetViews: 75, targetLikes: 18, targetFollows: 12, targetComments: 5, profileSetupRequired: false, graduated: false },
  7: { targetViews: 80, targetLikes: 25, targetFollows: 15, targetComments: 8, profileSetupRequired: false, graduated: true },
};

export class WarmupEngine {
  private currentDay: number;

  constructor(public readonly accountId: string, initialDay = 1) {
    this.currentDay = Math.min(Math.max(initialDay, 1), 7);
  }

  getCurrentDay(): number {
    return this.currentDay;
  }

  getCurrentDayPlan(): WarmupDayPlan {
    const template = WARMUP_SCHEDULE[this.currentDay] || WARMUP_SCHEDULE[7];
    return {
      day: this.currentDay,
      ...template,
    };
  }

  completeCurrentDay(): WarmupDayPlan {
    if (this.currentDay < 7) {
      this.currentDay += 1;
    }
    return this.getCurrentDayPlan();
  }
}
