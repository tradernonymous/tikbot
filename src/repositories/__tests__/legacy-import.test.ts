import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importLegacyPostsToDatabase, isLegacyDataImported } from '../legacy-import';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    researchPost: {
      upsert: vi.fn(),
    },
    postSnapshot: {
      create: vi.fn(),
    },
  },
}));

describe('R2.7 Legacy Data Migration to Database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks if legacy data is already imported', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      key: 'LEGACY_RESEARCH_POSTS_IMPORTED',
      value: 'true',
      updatedAt: new Date(),
    });

    const imported = await isLegacyDataImported();
    expect(imported).toBe(true);
  });

  it('imports legacy posts to Postgres and writes completion flag', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.researchPost.upsert).mockResolvedValue({
      id: 'rp-1',
      platform: 'TIKTOK',
      platformPostId: '7634241914350341397',
      authorHandle: 'jackprintezy',
      caption: 'Viral Video',
      viewCount: 18400,
      likeCount: 2100,
      commentCount: 142,
      shareCount: 288,
      outlierScore: 4.6,
      hookText: 'Hook',
      hookType: null,
      medianBaseline: null,
      confidence: null,
      creatorId: null,
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const legacyPosts = [
      {
        id: 'post-1',
        platformPostId: '7634241914350341397',
        authorHandle: 'jackprintezy',
        caption: 'Viral Video',
        viewCount: 18400,
        likeCount: 2100,
        commentCount: 142,
        shareCount: 288,
        outlierScore: 4.6,
      },
    ];

    const result = await importLegacyPostsToDatabase(legacyPosts);
    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);
    expect(prisma.researchPost.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'LEGACY_RESEARCH_POSTS_IMPORTED' },
      })
    );
  });
});
