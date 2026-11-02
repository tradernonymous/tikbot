import { ActionType, globalAccountRateLimiter } from './rate-limiter';

export interface ProofArtifact {
  action: ActionType;
  targetUrl: string;
  accountId: string;
  timestamp: string;
  screenshotHash?: string;
  domSnippet?: string;
}

export interface FarmInteractionDriver {
  like(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  comment(options: { url: string; accountId: string; text: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  watchLive(options: { url: string; accountId: string; durationSeconds: number; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  share?(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  save?(options: { url: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  follow?(options: { targetHandle: string; accountId: string; proxy?: any }): Promise<{ success: boolean; proof: ProofArtifact }>;
  fypPush?(options: { url: string; accountId: string; steps: any[]; proxy?: any }): Promise<{ success: boolean; executedSteps: string[]; proof: ProofArtifact }>;
}

export class ActionCapExceededError extends Error {
  constructor(reason?: string) {
    super(`Action cap exceeded: ${reason || 'Limit reached'}`);
    this.name = 'ActionCapExceededError';
  }
}

export class CommentBank {
  private comments: Record<string, string[]> = {
    GENERAL: [
      'This is genuinely informative, thanks for sharing!',
      'Great perspective on this.',
      'So well explained!',
      'Saving this for later reference.',
      'Super helpful breakdown.',
    ],
    GROWTH: [
      'The growth trajectory here is impressive.',
      'Key insight right at the start!',
      'Bookmarking this strategy.',
      'Consistency is definitely king here.',
    ],
    FEEDBACK: [
      'Really appreciate the clean structure here.',
      'Point 2 resonated strongly.',
      'High value execution right here.',
    ],
  };

  getRandomComment(category = 'GENERAL'): string {
    const list = this.comments[category] || this.comments.GENERAL;
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }
}

export const defaultCommentBank = new CommentBank();

export async function executeFarmLike(
  options: { accountId: string; url: string; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'LIKE');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }

  const result = await driver.like({
    url: options.url,
    accountId: options.accountId,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'LIKE');
  return result;
}

export async function executeFarmComment(
  options: { accountId: string; url: string; commentText?: string; category?: string; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; commentText: string; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'COMMENT');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }

  const text = options.commentText || defaultCommentBank.getRandomComment(options.category);

  const result = await driver.comment({
    url: options.url,
    accountId: options.accountId,
    text,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'COMMENT');
  return {
    ...result,
    commentText: text,
  };
}

export async function executeFarmLive(
  options: { accountId: string; url: string; durationSeconds?: number; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'LIVE_VIEW');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }

  const duration = options.durationSeconds ?? 60;
  const result = await driver.watchLive({
    url: options.url,
    accountId: options.accountId,
    durationSeconds: duration,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'LIVE_VIEW');
  return result;
}

export async function executeFarmShare(
  options: { accountId: string; url: string; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'SHARE');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }
  if (!driver.share) {
    throw new Error('Driver capability not configured for action: SHARE');
  }

  const result = await driver.share({
    url: options.url,
    accountId: options.accountId,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'SHARE');
  return result;
}

export async function executeFarmSave(
  options: { accountId: string; url: string; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'SAVE');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }
  if (!driver.save) {
    throw new Error('Driver capability not configured for action: SAVE');
  }

  const result = await driver.save({
    url: options.url,
    accountId: options.accountId,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'SAVE');
  return result;
}

export async function executeFarmFollow(
  options: { accountId: string; targetHandle: string; proxy?: any },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'FOLLOW');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }
  if (!driver.follow) {
    throw new Error('Driver capability not configured for action: FOLLOW');
  }

  const result = await driver.follow({
    targetHandle: options.targetHandle,
    accountId: options.accountId,
    proxy: options.proxy,
  });

  await globalAccountRateLimiter.recordAction(options.accountId, 'FOLLOW');
  return result;
}

export async function executeFarmFypPush(
  options: {
    accountId: string;
    url: string;
    targetHandle?: string;
    steps?: string[];
    proxy?: any;
  },
  driver: FarmInteractionDriver
): Promise<{ success: boolean; executedSteps: string[]; proof: ProofArtifact }> {
  const check = await globalAccountRateLimiter.canPerformAction(options.accountId, 'VIEW');
  if (!check.allowed) {
    throw new ActionCapExceededError(check.reason);
  }

  const stepsToExecute = options.steps || ['WATCH', 'LIKE', 'SAVE'];

  if (driver.fypPush) {
    const res = await driver.fypPush({
      url: options.url,
      accountId: options.accountId,
      steps: stepsToExecute,
      proxy: options.proxy,
    });
    await globalAccountRateLimiter.recordAction(options.accountId, 'VIEW');
    return res;
  }

  const executed: string[] = ['WATCH'];
  await globalAccountRateLimiter.recordAction(options.accountId, 'VIEW');

  if (stepsToExecute.includes('LIKE')) {
    const likeCheck = await globalAccountRateLimiter.canPerformAction(options.accountId, 'LIKE');
    if (likeCheck.allowed) {
      await driver.like({ url: options.url, accountId: options.accountId, proxy: options.proxy });
      await globalAccountRateLimiter.recordAction(options.accountId, 'LIKE');
      executed.push('LIKE');
    }
  }

  if (stepsToExecute.includes('SAVE') && driver.save) {
    const saveCheck = await globalAccountRateLimiter.canPerformAction(options.accountId, 'SAVE');
    if (saveCheck.allowed) {
      await driver.save({ url: options.url, accountId: options.accountId, proxy: options.proxy });
      await globalAccountRateLimiter.recordAction(options.accountId, 'SAVE');
      executed.push('SAVE');
    }
  }

  if (stepsToExecute.includes('SHARE') && driver.share) {
    const shareCheck = await globalAccountRateLimiter.canPerformAction(options.accountId, 'SHARE');
    if (shareCheck.allowed) {
      await driver.share({ url: options.url, accountId: options.accountId, proxy: options.proxy });
      await globalAccountRateLimiter.recordAction(options.accountId, 'SHARE');
      executed.push('SHARE');
    }
  }

  if (stepsToExecute.includes('FOLLOW') && driver.follow && options.targetHandle) {
    const followCheck = await globalAccountRateLimiter.canPerformAction(options.accountId, 'FOLLOW');
    if (followCheck.allowed) {
      await driver.follow({ targetHandle: options.targetHandle, accountId: options.accountId, proxy: options.proxy });
      await globalAccountRateLimiter.recordAction(options.accountId, 'FOLLOW');
      executed.push('FOLLOW');
    }
  }

  return {
    success: true,
    executedSteps: executed,
    proof: {
      action: 'VIEW',
      targetUrl: options.url,
      accountId: options.accountId,
      timestamp: new Date().toISOString(),
    },
  };
}
