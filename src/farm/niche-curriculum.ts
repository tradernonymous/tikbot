export interface NicheCurriculum {
  nicheKey: string;
  name: string;
  hashtags: string[];
  creators: string[];
  sounds: string[];
  targetAlignmentThreshold: number;
}

export interface WarmupSessionPlan {
  accountId: string;
  nicheKey: string;
  totalScrolls: number;
  targetLikeCount: number;
  targetFollowCount: number;
  dwellVariances: number[]; // seconds per video
  staggerDelaySeconds: number;
}

export class NicheCurriculumEngine {
  private curricula = new Map<string, NicheCurriculum>();

  registerCurriculum(curriculum: NicheCurriculum): void {
    this.curricula.set(curriculum.nicheKey, { ...curriculum });
  }

  getCurriculum(nicheKey: string): NicheCurriculum | undefined {
    return this.curricula.get(nicheKey);
  }

  listCurricula(): NicheCurriculum[] {
    return Array.from(this.curricula.values());
  }

  generateTrainingSession(
    accountId: string,
    nicheKey: string,
    scrollCount = 20
  ): WarmupSessionPlan {
    // Human like fraction: 25% to 40% of watched videos get likes, never 100%
    const likeFraction = 0.25 + (Math.abs(accountId.length % 15)) * 0.01;
    const targetLikes = Math.max(1, Math.round(scrollCount * likeFraction));

    // Dwell variance per scroll: between 3.5s and 18.0s
    const dwellVariances: number[] = [];
    for (let i = 0; i < scrollCount; i++) {
      const baseDwell = 4.0;
      const jitter = ((i * 7 + accountId.charCodeAt(i % accountId.length)) % 140) / 10;
      dwellVariances.push(baseDwell + jitter);
    }

    return {
      accountId,
      nicheKey,
      totalScrolls: scrollCount,
      targetLikeCount: targetLikes,
      targetFollowCount: Math.min(2, Math.floor(scrollCount / 10)),
      dwellVariances,
      staggerDelaySeconds: 15 + (accountId.length % 15),
    };
  }
}
