export interface EngagementConfig {
  likeProbability: number;
  commentProbability: number;
  shareProbability: number;
  saveProbability: number;
  followProbability?: number;
}

export interface PlannedEngagementActions {
  shouldLike: boolean;
  shouldComment: boolean;
  shouldShare: boolean;
  shouldSave: boolean;
  shouldFollow: boolean;
}

export function determineEngagementAction(
  accountId: string,
  config: EngagementConfig
): PlannedEngagementActions {
  const seed = accountId.split('').reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);

  const rollLike = ((seed * 17) % 1000) / 1000;
  const rollComment = ((seed * 31) % 1000) / 1000;
  const rollShare = ((seed * 47) % 1000) / 1000;
  const rollSave = ((seed * 61) % 1000) / 1000;
  const rollFollow = ((seed * 73) % 1000) / 1000;

  return {
    shouldLike: rollLike < config.likeProbability,
    shouldComment: rollComment < config.commentProbability,
    shouldShare: rollShare < config.shareProbability,
    shouldSave: rollSave < config.saveProbability,
    shouldFollow: rollFollow < (config.followProbability ?? 0.01),
  };
}
