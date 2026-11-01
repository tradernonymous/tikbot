export interface HealthScoreComponents {
  reachTrendRatio: number; // 0 to 1+ (30 pts)
  loginSuccessRate: number; // 0 to 1.0 (20 pts)
  captchaChallengeCountLast7d: number; // 0 = 25 pts, -5 pts each
  actionSuccessRate: number; // 0 to 1.0 (15 pts)
  accountAgeDays: number; // 0 to 45+ (10 pts)
}

export interface HealthScoreBreakdown {
  reachPoints: number;
  loginPoints: number;
  securityPoints: number;
  actionPoints: number;
  agePoints: number;
}

export type HealthStatusCategory = 'PRIME_HEALTH' | 'NORMAL' | 'DEGRADED' | 'CRITICAL';

export interface HealthScoreResult {
  score: number; // 0 to 100
  status: HealthStatusCategory;
  breakdown: HealthScoreBreakdown;
}

export function calculateAccountHealthScore(components: HealthScoreComponents): HealthScoreResult {
  // 1. Reach points (30 max)
  const reachPoints = Math.round(Math.min(30, Math.max(0, components.reachTrendRatio * 30)));

  // 2. Login points (20 max)
  const loginPoints = Math.round(Math.min(20, Math.max(0, components.loginSuccessRate * 20)));

  // 3. Security / Captcha points (25 max)
  const penalty = components.captchaChallengeCountLast7d * 5;
  const securityPoints = Math.max(0, 25 - penalty);

  // 4. Action success rate (15 max)
  const actionPoints = Math.round(Math.min(15, Math.max(0, components.actionSuccessRate * 15)));

  // 5. Account age points (10 max)
  const agePoints = Math.round(Math.min(10, Math.max(0, (components.accountAgeDays / 45) * 10)));

  const totalScore = Math.min(100, Math.max(0, reachPoints + loginPoints + securityPoints + actionPoints + agePoints));

  let status: HealthStatusCategory = 'NORMAL';
  if (totalScore >= 90) status = 'PRIME_HEALTH';
  else if (totalScore >= 70) status = 'NORMAL';
  else if (totalScore >= 50) status = 'DEGRADED';
  else status = 'CRITICAL';

  return {
    score: totalScore,
    status,
    breakdown: {
      reachPoints,
      loginPoints,
      securityPoints,
      actionPoints,
      agePoints,
    },
  };
}
