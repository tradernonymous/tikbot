import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerDefaultJobHandlers,
  executeJobHandler,
  setFarmInteractionDriver,
  HandlerNotConfiguredError,
} from '../worker';
import { FarmInteractionDriver, ActionCapExceededError } from '../farm/farm-actions';
import { globalAccountRateLimiter } from '../farm/rate-limiter';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      accountActionLedger: {
        create: vi.fn().mockResolvedValue({ id: 'ledger-mock-1' }),
        count: vi.fn().mockResolvedValue(0),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };
});

describe('Worker Real Farm Execution Handlers (R3.2)', () => {
  let mockDriver: FarmInteractionDriver;

  beforeEach(async () => {
    vi.clearAllMocks();
    setFarmInteractionDriver(null);
    registerDefaultJobHandlers();
    await globalAccountRateLimiter.resetAccount('acc-farm-1');
    (prisma.accountActionLedger.count as any).mockResolvedValue(0);

    mockDriver = {
      like: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'LIKE',
          targetUrl: 'https://tiktok.com/@u/video/100',
          accountId: 'acc-farm-1',
          timestamp: new Date().toISOString(),
          domSnippet: '<svg class="like-button active" />',
          screenshotHash: 'hash-like-123',
        },
      }),
      comment: vi.fn().mockImplementation(async ({ url, accountId, text }) => ({
        success: true,
        proof: {
          action: 'COMMENT',
          targetUrl: url,
          accountId,
          timestamp: new Date().toISOString(),
          domSnippet: `<div class="comment">${text}</div>`,
          screenshotHash: 'hash-comment-456',
        },
      })),
      watchLive: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'LIVE_VIEW',
          targetUrl: 'https://tiktok.com/@u/live',
          accountId: 'acc-farm-1',
          timestamp: new Date().toISOString(),
          domSnippet: '<video class="live-player" />',
          screenshotHash: 'hash-live-789',
        },
      }),
      share: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'SHARE',
          targetUrl: 'https://tiktok.com/@u/video/100',
          accountId: 'acc-farm-1',
          timestamp: new Date().toISOString(),
          domSnippet: '<button class="share-btn success" />',
        },
      }),
      save: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'SAVE',
          targetUrl: 'https://tiktok.com/@u/video/100',
          accountId: 'acc-farm-1',
          timestamp: new Date().toISOString(),
          domSnippet: '<button class="favorite-btn active" />',
        },
      }),
      follow: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'FOLLOW',
          targetUrl: 'https://tiktok.com/@u',
          accountId: 'acc-farm-1',
          timestamp: new Date().toISOString(),
          domSnippet: '<button class="follow-btn following" />',
        },
      }),
    };
  });

  it('rejects farm actions when driver is not configured', async () => {
    await expect(
      executeJobHandler('farm.like', { url: 'https://tiktok.com/@u/video/100', accountId: 'acc-farm-1' })
    ).rejects.toThrow(HandlerNotConfiguredError);

    await expect(
      executeJobHandler('farm.comment', { url: 'https://tiktok.com/@u/video/100', accountId: 'acc-farm-1' })
    ).rejects.toThrow(HandlerNotConfiguredError);

    await expect(
      executeJobHandler('farm.live', { url: 'https://tiktok.com/@u/live', accountId: 'acc-farm-1' })
    ).rejects.toThrow(HandlerNotConfiguredError);
  });

  it('executes farm.like and returns proof when driver is configured', async () => {
    setFarmInteractionDriver(mockDriver);

    const result = (await executeJobHandler('farm.like', {
      url: 'https://tiktok.com/@u/video/100',
      accountId: 'acc-farm-1',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.proof).toBeDefined();
    expect(result.proof.screenshotHash).toBe('hash-like-123');
    expect(mockDriver.like).toHaveBeenCalledTimes(1);
    expect(prisma.accountActionLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'acc-farm-1',
          actionType: 'LIKE',
        }),
      })
    );
  });

  it('rejects farm.like with ActionCapExceededError when rate limit is exceeded', async () => {
    setFarmInteractionDriver(mockDriver);
    (prisma.accountActionLedger.count as any).mockResolvedValue(10); // cap is 5/hour

    await expect(
      executeJobHandler('farm.like', {
        url: 'https://tiktok.com/@u/video/100',
        accountId: 'acc-farm-1',
      })
    ).rejects.toThrow(ActionCapExceededError);

    expect(mockDriver.like).not.toHaveBeenCalled();
  });

  it('executes farm.comment with comment text and proof artifact', async () => {
    setFarmInteractionDriver(mockDriver);

    const result = (await executeJobHandler('farm.comment', {
      url: 'https://tiktok.com/@u/video/100',
      accountId: 'acc-farm-1',
      commentText: 'Awesome strategy video!',
    })) as any;

    expect(result.success).toBe(true);
    expect(result.commentText).toBe('Awesome strategy video!');
    expect(result.proof.domSnippet).toContain('Awesome strategy video!');
    expect(mockDriver.comment).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acc-farm-1',
        text: 'Awesome strategy video!',
      })
    );
  });

  it('executes farm.live and returns proof', async () => {
    setFarmInteractionDriver(mockDriver);

    const result = (await executeJobHandler('farm.live', {
      url: 'https://tiktok.com/@u/live',
      accountId: 'acc-farm-1',
      durationSeconds: 120,
    })) as any;

    expect(result.success).toBe(true);
    expect(result.proof.action).toBe('LIVE_VIEW');
    expect(mockDriver.watchLive).toHaveBeenCalledTimes(1);
  });

  it('executes farm.share and farm.save with rate check enforcement', async () => {
    setFarmInteractionDriver(mockDriver);

    const shareResult = (await executeJobHandler('farm.share', {
      url: 'https://tiktok.com/@u/video/100',
      accountId: 'acc-farm-1',
    })) as any;
    expect(shareResult.success).toBe(true);
    expect(mockDriver.share).toHaveBeenCalledTimes(1);

    const saveResult = (await executeJobHandler('farm.save', {
      url: 'https://tiktok.com/@u/video/100',
      accountId: 'acc-farm-1',
    })) as any;
    expect(saveResult.success).toBe(true);
    expect(mockDriver.save).toHaveBeenCalledTimes(1);
  });

  it('executes farm.follow with target handle', async () => {
    setFarmInteractionDriver(mockDriver);

    const followResult = (await executeJobHandler('farm.follow', {
      targetHandle: '@creator_handle',
      accountId: 'acc-farm-1',
    })) as any;
    expect(followResult.success).toBe(true);
    expect(mockDriver.follow).toHaveBeenCalledWith(
      expect.objectContaining({ targetHandle: '@creator_handle' })
    );
  });

  it('executes full farm.fyp_push orchestrating decomposed watch, like, save steps', async () => {
    setFarmInteractionDriver(mockDriver);

    const fypResult = (await executeJobHandler('farm.fyp_push', {
      url: 'https://tiktok.com/@u/video/100',
      accountId: 'acc-farm-1',
      targetHandle: '@creator_handle',
      steps: ['WATCH', 'LIKE', 'SAVE', 'SHARE'],
    })) as any;

    expect(fypResult.success).toBe(true);
    expect(fypResult.executedSteps).toContain('WATCH');
    expect(fypResult.executedSteps).toContain('LIKE');
    expect(fypResult.executedSteps).toContain('SAVE');
    expect(fypResult.executedSteps).toContain('SHARE');
  });
});
