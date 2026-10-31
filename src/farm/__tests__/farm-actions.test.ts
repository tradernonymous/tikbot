import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CommentBank,
  ActionCapExceededError,
  FarmInteractionDriver,
  ProofArtifact,
  executeFarmLike,
  executeFarmComment,
  executeFarmLive,
} from '../farm-actions';
import { globalAccountRateLimiter } from '../rate-limiter';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      accountActionLedger: {
        create: vi.fn().mockResolvedValue({ id: 'ledger-1' }),
        count: vi.fn().mockResolvedValue(0),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };
});

describe('Farm Actions & Interactive Handlers (R3.2)', () => {
  let mockDriver: FarmInteractionDriver;

  beforeEach(async () => {
    vi.clearAllMocks();
    await globalAccountRateLimiter.resetAccount('acc-101');
    (prisma.accountActionLedger.count as any).mockResolvedValue(0);

    mockDriver = {
      like: vi.fn().mockResolvedValue({
        success: true,
        proof: {
          action: 'LIKE',
          targetUrl: 'https://tiktok.com/@creator/video/123',
          accountId: 'acc-101',
          timestamp: new Date().toISOString(),
          domSnippet: '<span data-e2e="like-icon" aria-pressed="true"></span>',
          screenshotHash: 'a1b2c3d4e5f6',
        },
      }),
      comment: vi.fn().mockImplementation(async ({ url, accountId, text }) => ({
        success: true,
        proof: {
          action: 'COMMENT',
          targetUrl: url,
          accountId,
          timestamp: new Date().toISOString(),
          domSnippet: `<p class="comment-text">${text}</p>`,
          screenshotHash: 'b2c3d4e5f6a1',
        },
      })),
      watchLive: vi.fn().mockImplementation(async ({ url, accountId, durationSeconds }) => ({
        success: true,
        proof: {
          action: 'LIVE_VIEW',
          targetUrl: url,
          accountId,
          timestamp: new Date().toISOString(),
          domSnippet: `<div class="live-room-player" data-duration="${durationSeconds}"></div>`,
          screenshotHash: 'c3d4e5f6a1b2',
        },
      })),
    };
  });

  describe('CommentBank', () => {
    it('returns non-empty curated comments across categories', () => {
      const bank = new CommentBank();
      const generalComment = bank.getRandomComment('GENERAL');
      expect(generalComment).toBeTruthy();
      expect(typeof generalComment).toBe('string');

      const growthComment = bank.getRandomComment('GROWTH');
      expect(growthComment).toBeTruthy();

      const fallback = bank.getRandomComment('NON_EXISTENT');
      expect(fallback).toBeTruthy();
    });
  });

  describe('executeFarmLike', () => {
    it('runs driver, creates ledger entry, and returns proof when under cap', async () => {
      const result = await executeFarmLike(
        {
          accountId: 'acc-101',
          url: 'https://tiktok.com/@creator/video/123',
        },
        mockDriver
      );

      expect(result.success).toBe(true);
      expect(result.proof).toBeDefined();
      expect(result.proof.action).toBe('LIKE');
      expect(mockDriver.like).toHaveBeenCalledTimes(1);
      expect(prisma.accountActionLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-101',
            actionType: 'LIKE',
          }),
        })
      );
    });

    it('rejects action and throws ActionCapExceededError when over hourly or daily cap', async () => {
      // LIKE cap is 5 per hour
      (prisma.accountActionLedger.count as any).mockResolvedValue(5);

      await expect(
        executeFarmLike(
          {
            accountId: 'acc-101',
            url: 'https://tiktok.com/@creator/video/123',
          },
          mockDriver
        )
      ).rejects.toThrow(ActionCapExceededError);

      expect(mockDriver.like).not.toHaveBeenCalled();
    });
  });

  describe('executeFarmComment', () => {
    it('selects comment from bank if none provided, executes driver, and stores ledger', async () => {
      const result = await executeFarmComment(
        {
          accountId: 'acc-101',
          url: 'https://tiktok.com/@creator/video/123',
        },
        mockDriver
      );

      expect(result.success).toBe(true);
      expect(result.commentText).toBeTruthy();
      expect(mockDriver.comment).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'acc-101',
          text: result.commentText,
        })
      );
      expect(prisma.accountActionLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-101',
            actionType: 'COMMENT',
          }),
        })
      );
    });

    it('rejects action when COMMENT cap is exceeded', async () => {
      (prisma.accountActionLedger.count as any).mockResolvedValue(3); // Hourly cap is 3

      await expect(
        executeFarmComment(
          {
            accountId: 'acc-101',
            url: 'https://tiktok.com/@creator/video/123',
            commentText: 'Great content!',
          },
          mockDriver
        )
      ).rejects.toThrow(ActionCapExceededError);

      expect(mockDriver.comment).not.toHaveBeenCalled();
    });
  });

  describe('executeFarmLive', () => {
    it('executes live watch, stores ledger row and returns proof', async () => {
      const result = await executeFarmLive(
        {
          accountId: 'acc-101',
          url: 'https://tiktok.com/@creator/live',
          durationSeconds: 60,
        },
        mockDriver
      );

      expect(result.success).toBe(true);
      expect(result.proof.action).toBe('LIVE_VIEW');
      expect(mockDriver.watchLive).toHaveBeenCalledTimes(1);
      expect(prisma.accountActionLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-101',
            actionType: 'LIVE_VIEW',
          }),
        })
      );
    });

    it('rejects action when LIVE_VIEW cap is exceeded', async () => {
      (prisma.accountActionLedger.count as any).mockResolvedValue(1); // Hourly cap is 1

      await expect(
        executeFarmLive(
          {
            accountId: 'acc-101',
            url: 'https://tiktok.com/@creator/live',
            durationSeconds: 60,
          },
          mockDriver
        )
      ).rejects.toThrow(ActionCapExceededError);

      expect(mockDriver.watchLive).not.toHaveBeenCalled();
    });
  });
});
