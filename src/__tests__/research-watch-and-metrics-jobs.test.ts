import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  jobHandlerRegistry,
  registerDefaultJobHandlers,
  setDouyinTikTokClient,
} from '@/worker';
import { prisma } from '@/lib/prisma';
import { DouyinTikTokClient } from '@/research/download-api-client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    researchPost: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    postSnapshot: {
      create: vi.fn(),
    },
    creator: {
      upsert: vi.fn(),
    },
    metricSample: {
      create: vi.fn(),
    },
  },
}));

describe('R2.4 & R2.5 research.watch & metrics.collect Worker Job Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerDefaultJobHandlers();
  });

  it('registers research.watch and metrics.collect handlers', () => {
    expect(jobHandlerRegistry.has('research.watch')).toBe(true);
    expect(jobHandlerRegistry.has('metrics.collect')).toBe(true);
  });

  it('research.watch handler ingests creator video, upserts post, and is idempotent', async () => {
    const mockClient = {
      extractVideoData: vi.fn().mockResolvedValue({
        platform: 'TIKTOK',
        postId: 'post_999',
        caption: 'Viral marketing tips',
        playUrl: 'https://cdn.example.com/video.mp4',
        coverUrl: 'https://cdn.example.com/cover.jpg',
        author: { handle: 'top_creator', nickname: 'Top Creator' },
        stats: { views: 50000, likes: 10000, comments: 200, shares: 50 },
      }),
    };
    setDouyinTikTokClient(mockClient as any);

    vi.mocked(prisma.creator.upsert).mockResolvedValue({
      id: 'creator-1',
      platform: 'TIKTOK',
      handle: 'top_creator',
      platformUserId: null,
      followerCount: 0,
      videoCount: 0,
      medianViews: 0,
      madViews: 0,
      sampleSize: 0,
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.researchPost.upsert).mockResolvedValue({
      id: 'rp-1',
      platform: 'TIKTOK',
      platformPostId: 'post_999',
      authorHandle: 'top_creator',
      caption: 'Viral marketing tips',
      viewCount: 50000,
      likeCount: 10000,
      commentCount: 200,
      shareCount: 50,
      outlierScore: 2.0,
      medianBaseline: 25000,
      confidence: 0.9,
      creatorId: null,
      hookText: null,
      hookType: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const handler = jobHandlerRegistry.get('research.watch')!;
    const result1 = await handler({ handle: 'top_creator', url: 'https://tiktok.com/@top_creator/video/post_999' });

    expect(result1).toHaveProperty('success', true);
    expect(prisma.researchPost.upsert).toHaveBeenCalledTimes(1);

    // Second run with same post (idempotency check)
    const result2 = await handler({ handle: 'top_creator', url: 'https://tiktok.com/@top_creator/video/post_999' });
    expect(result2).toHaveProperty('success', true);
    // Upsert called again with same unique platformPostId, meaning no duplicate rows created
    expect(prisma.researchPost.upsert).toHaveBeenCalledTimes(2);
  });

  it('metrics.collect handler records MetricSample and returns sample id', async () => {
    vi.mocked(prisma.metricSample.create).mockResolvedValue({
      id: 'sample-99',
      targetType: 'RESEARCH_POST',
      targetId: 'rp-1',
      views: 52000,
      likes: 10500,
      comments: 210,
      shares: 55,
      timestamp: new Date(),
      researchPostId: 'rp-1',
    });

    const handler = jobHandlerRegistry.get('metrics.collect')!;
    const res = await handler({
      targetType: 'RESEARCH_POST',
      targetId: 'rp-1',
      views: 52000,
      likes: 10500,
      comments: 210,
      shares: 55,
    });

    expect(res).toHaveProperty('success', true);
    expect(res).toHaveProperty('sampleId', 'sample-99');
    expect(prisma.metricSample.create).toHaveBeenCalledTimes(1);
  });
});
