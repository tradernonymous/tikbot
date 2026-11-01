export interface CreatorPostMetric {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  commentSnippets?: string[];
}

export interface CreatorVettingInput {
  handle: string;
  followerCount: number;
  posts: CreatorPostMetric[];
  osintCrossCheck?: {
    accountAgeDays: number;
    hasVerifiedBioLink: boolean;
    detectedPlatforms: string[];
  };
}

export type FraudFlag =
  | 'SUSPICIOUS_LIKE_RATIO'
  | 'BOT_COMMENT_CLUSTER'
  | 'INACTIVE_ENGAGEMENT'
  | 'GHOST_FOLLOWERS';

export interface CreatorVettingResult {
  handle: string;
  authenticityScore: number; // 0 - 100
  fraudFlags: FraudFlag[];
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  avgLikeRatioPercent: number;
  avgCommentRatioPercent: number;
  provenance: 'live_evaluation';
}

export function evaluateCreatorAuthenticity(input: CreatorVettingInput): CreatorVettingResult {
  const posts = input.posts || [];
  const fraudFlags: FraudFlag[] = [];

  if (posts.length === 0) {
    return {
      handle: input.handle,
      authenticityScore: 50,
      fraudFlags: ['INACTIVE_ENGAGEMENT'],
      riskTier: 'MEDIUM',
      avgLikeRatioPercent: 0,
      avgCommentRatioPercent: 0,
      provenance: 'live_evaluation',
    };
  }

  // Calculate like & comment ratios
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  const allComments: string[] = [];

  posts.forEach((p) => {
    totalViews += p.views;
    totalLikes += p.likes;
    totalComments += p.comments;
    if (p.commentSnippets) {
      allComments.push(...p.commentSnippets);
    }
  });

  const avgLikeRatioPercent = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
  const avgCommentRatioPercent = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;

  // Fraud check 1: Like ratio
  // Healthy organic TikTok range is typically 3% to 20%.
  // < 0.5% (bought view bots) or > 40% (bought likes) indicates manipulation.
  if (avgLikeRatioPercent < 0.5 || avgLikeRatioPercent > 40) {
    fraudFlags.push('SUSPICIOUS_LIKE_RATIO');
  }

  // Fraud check 2: Bot comment repetition
  if (allComments.length >= 4) {
    const counts = new Map<string, number>();
    allComments.forEach((c) => {
      const normalized = c.trim().toLowerCase();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });

    const maxRepeat = Math.max(...Array.from(counts.values()));
    // If over 50% of sampled comments are identical short strings
    if (maxRepeat / allComments.length >= 0.5) {
      fraudFlags.push('BOT_COMMENT_CLUSTER');
    }
  }

  // Fraud check 3: Ghost followers
  if (input.followerCount > 50000 && totalViews / posts.length < 500) {
    fraudFlags.push('GHOST_FOLLOWERS');
  }

  let authenticityScore = 90;
  if (fraudFlags.includes('SUSPICIOUS_LIKE_RATIO')) authenticityScore -= 40;
  if (fraudFlags.includes('BOT_COMMENT_CLUSTER')) authenticityScore -= 30;
  if (fraudFlags.includes('GHOST_FOLLOWERS')) authenticityScore -= 20;

  // Bonus for cross-platform footprint
  if (input.osintCrossCheck && input.osintCrossCheck.detectedPlatforms.length >= 2) {
    authenticityScore = Math.min(100, authenticityScore + 5);
  }

  authenticityScore = Math.max(10, Math.min(100, authenticityScore));

  const riskTier: 'LOW' | 'MEDIUM' | 'HIGH' =
    authenticityScore >= 75 ? 'LOW' : authenticityScore >= 50 ? 'MEDIUM' : 'HIGH';

  return {
    handle: input.handle,
    authenticityScore,
    fraudFlags,
    riskTier,
    avgLikeRatioPercent: Math.round(avgLikeRatioPercent * 100) / 100,
    avgCommentRatioPercent: Math.round(avgCommentRatioPercent * 100) / 100,
    provenance: 'live_evaluation',
  };
}
