import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  upsertCreator,
  updateCreatorBaseline,
} from '../creators.repository';
import {
  recordMetricSample,
  queryMetricSeries,
} from '../metric-samples.repository';
import {
  listResearchPosts,
  upsertResearchPost,
} from '../research-posts.repository';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    creator: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    metricSample: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    researchPost: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    postSnapshot: {
      create: vi.fn(),
    },
  },
}));

describe('Research & Metrics Repositories Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('creators.repository', () => {
    it('upserts a creator and updates follower/video counts', async () => {
      vi.mocked(prisma.creator.upsert).mockResolvedValue({
        id: 'c-1',
        platform: 'TIKTOK',
        handle: 'viral_lead',
        platformUserId: 'usr_1',
        followerCount: 50000,
        videoCount: 120,
        medianViews: 20000,
        madViews: 5000,
        sampleSize: 15,
        lastScrapedAt: new Date('2026-10-31T12:00:00Z'),
        createdAt: new Date('2026-10-01T00:00:00Z'),
        updatedAt: new Date('2026-10-31T12:00:00Z'),
      });

      const res = await upsertCreator({
        platform: 'TIKTOK',
        handle: 'viral_lead',
        followerCount: 50000,
        videoCount: 120,
      });

      expect(res).not.toBeNull();
      expect(res?.handle).toBe('viral_lead');
      expect(res?.followerCount).toBe(50000);
      expect(prisma.creator.upsert).toHaveBeenCalled();
    });

    it('returns null on database failure in upsertCreator', async () => {
      vi.mocked(prisma.creator.upsert).mockRejectedValue(new Error('DB connection failed'));
      const res = await upsertCreator({ handle: 'failed_creator' });
      expect(res).toBeNull();
    });

    it('updates creator baseline statistics', async () => {
      vi.mocked(prisma.creator.update).mockResolvedValue({} as any);
      const ok = await updateCreatorBaseline('c-1', 25000, 4000, 20);
      expect(ok).toBe(true);
      expect(prisma.creator.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c-1' },
          data: expect.objectContaining({ medianViews: 25000, madViews: 4000, sampleSize: 20 }),
        })
      );
    });

    it('returns false when updateCreatorBaseline throws', async () => {
      vi.mocked(prisma.creator.update).mockRejectedValue(new Error('Update error'));
      const ok = await updateCreatorBaseline('c-fail', 1, 1, 1);
      expect(ok).toBe(false);
    });
  });

  describe('metric-samples.repository', () => {
    it('records metric sample successfully', async () => {
      vi.mocked(prisma.metricSample.create).mockResolvedValue({
        id: 's-10',
        targetType: 'PUBLISH_JOB',
        targetId: 'pub-1',
        views: 12000,
        likes: 3000,
        comments: 150,
        shares: 40,
        timestamp: new Date('2026-10-31T10:00:00Z'),
        researchPostId: null,
      });

      const res = await recordMetricSample({
        targetType: 'PUBLISH_JOB',
        targetId: 'pub-1',
        views: 12000,
        likes: 3000,
        comments: 150,
        shares: 40,
      });

      expect(res).not.toBeNull();
      expect(res?.id).toBe('s-10');
      expect(res?.views).toBe(12000);
    });

    it('returns null when recordMetricSample throws', async () => {
      vi.mocked(prisma.metricSample.create).mockRejectedValue(new Error('Insert error'));
      const res = await recordMetricSample({
        targetType: 'PUBLISH_JOB',
        targetId: 'pub-fail',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      });
      expect(res).toBeNull();
    });

    it('queries metric series with date filtering', async () => {
      vi.mocked(prisma.metricSample.findMany).mockResolvedValue([
        {
          id: 's-1',
          targetType: 'RESEARCH_POST',
          targetId: 'rp-1',
          views: 100,
          likes: 20,
          comments: 2,
          shares: 0,
          timestamp: new Date('2026-10-30T00:00:00Z'),
          researchPostId: 'rp-1',
        },
      ]);

      const from = new Date('2026-10-29T00:00:00Z');
      const to = new Date('2026-10-31T00:00:00Z');
      const series = await queryMetricSeries('RESEARCH_POST', 'rp-1', from, to);

      expect(series).toHaveLength(1);
      expect(prisma.metricSample.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetType: 'RESEARCH_POST',
            targetId: 'rp-1',
            timestamp: { gte: from, lte: to },
          }),
        })
      );
    });

    it('returns empty array when queryMetricSeries throws', async () => {
      vi.mocked(prisma.metricSample.findMany).mockRejectedValue(new Error('Query error'));
      const series = await queryMetricSeries('RESEARCH_POST', 'rp-fail');
      expect(series).toEqual([]);
    });
  });

  describe('research-posts.repository sorting & filtering branches', () => {
    it('handles outlier and views sorting and cursor pagination', async () => {
      const getSampleRows = () => [
        {
          id: 'rp-1',
          platform: 'TIKTOK',
          platformPostId: 'post-1',
          authorHandle: 'creator1',
          caption: 'Great post',
          viewCount: 100000,
          likeCount: 20000,
          commentCount: 500,
          shareCount: 100,
          hookText: 'Hook 1',
          hookType: 'POV',
          outlierScore: 5.0,
          medianBaseline: 20000,
          confidence: 0.9,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          creatorId: null,
        },
        {
          id: 'rp-2',
          platform: 'TIKTOK',
          platformPostId: 'post-2',
          authorHandle: 'creator2',
          caption: 'Another post',
          viewCount: 80000,
          likeCount: 15000,
          commentCount: 400,
          shareCount: 80,
          hookText: null,
          hookType: null,
          outlierScore: 4.0,
          medianBaseline: 20000,
          confidence: 0.8,
          publishedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          creatorId: null,
        },
      ];

      (prisma.researchPost.findMany as any).mockImplementation(async () => getSampleRows());

      // Query with sort=outlier, minOutlierScore=3, authorHandle='creator'
      const res1 = await listResearchPosts({
        limit: 1,
        sort: 'outlier',
        minOutlierScore: 3,
        authorHandle: 'creator',
        cursor: 'rp-0',
      });

      expect(res1.posts).toHaveLength(1);
      expect(res1.nextCursor).toBe('rp-2');

      // Query with sort=views
      const res2 = await listResearchPosts({
        limit: 10,
        sort: 'views',
      });
      expect(res2.posts).toHaveLength(2);
      expect(res2.nextCursor).toBeNull();
    });

    it('returns empty array when listResearchPosts throws', async () => {
      vi.mocked(prisma.researchPost.findMany).mockRejectedValue(new Error('DB failure'));
      const res = await listResearchPosts({ limit: 10, sort: 'recent' });
      expect(res.posts).toEqual([]);
      expect(res.nextCursor).toBeNull();
    });

    it('returns null when upsertResearchPost throws', async () => {
      vi.mocked(prisma.researchPost.upsert).mockRejectedValue(new Error('Upsert failure'));
      const res = await upsertResearchPost({
        platform: 'TIKTOK',
        platformPostId: 'fail-1',
        authorHandle: 'fail',
        caption: 'fail',
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        outlierScore: 1,
      });
      expect(res).toBeNull();
    });
  });
});
