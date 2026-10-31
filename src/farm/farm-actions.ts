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
