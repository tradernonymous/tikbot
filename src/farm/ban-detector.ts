export type AccountHealthStatus = 'HEALTHY' | 'RESTRICTED' | 'BANNED' | 'RATE_LIMITED';
export type RecommendedAction = 'NONE' | 'MANUAL_CHALLENGE' | 'COOLDOWN' | 'QUARANTINE';

export interface PageInspectionInput {
  httpStatus: number;
  pageTitle?: string;
  bodySnippet: string;
}

export interface HealthEvaluationResult {
  status: AccountHealthStatus;
  recommendedAction: RecommendedAction;
  evidence: string;
}

export function evaluateAccountHealth(input: PageInspectionInput): HealthEvaluationResult {
  const lowerBody = input.bodySnippet.toLowerCase();
  const lowerTitle = (input.pageTitle || '').toLowerCase();

  // 1. Permanent Ban Detection
  if (
    lowerBody.includes('permanently banned') ||
    lowerBody.includes('account suspended') ||
    lowerTitle.includes('account suspended') ||
    lowerBody.includes('violations of our community guidelines')
  ) {
    return {
      status: 'BANNED',
      recommendedAction: 'QUARANTINE',
      evidence: input.bodySnippet.slice(0, 150),
    };
  }

  // 2. Challenge / Checkpoint Detection
  if (
    lowerBody.includes('drag the slider') ||
    lowerBody.includes('complete the puzzle') ||
    lowerBody.includes('captcha') ||
    lowerBody.includes('code sent to your phone') ||
    lowerBody.includes('verify your identity') ||
    lowerTitle.includes('verification')
  ) {
    return {
      status: 'RESTRICTED',
      recommendedAction: 'MANUAL_CHALLENGE',
      evidence: input.bodySnippet.slice(0, 150),
    };
  }

  // 3. Rate Limit Detection
  if (
    input.httpStatus === 429 ||
    lowerBody.includes('too many requests') ||
    lowerBody.includes('please wait before retrying') ||
    lowerBody.includes('frequent requests')
  ) {
    return {
      status: 'RATE_LIMITED',
      recommendedAction: 'COOLDOWN',
      evidence: `HTTP ${input.httpStatus}: ${input.bodySnippet.slice(0, 100)}`,
    };
  }

  // 4. Clean Healthy State
  return {
    status: 'HEALTHY',
    recommendedAction: 'NONE',
    evidence: 'Normal feed content present',
  };
}
