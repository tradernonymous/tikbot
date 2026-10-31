import { prisma } from '@/lib/prisma';
import { upsertResearchPost } from './research-posts.repository';

export const LEGACY_IMPORT_KEY = 'LEGACY_RESEARCH_POSTS_IMPORTED';

export async function isLegacyDataImported(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: LEGACY_IMPORT_KEY },
    });
    return setting?.value === 'true';
  } catch {
    return false;
  }
}

export async function importLegacyPostsToDatabase(
  posts: Array<{
    platformPostId?: string;
    id?: string;
    authorHandle: string;
    caption: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    outlierScore?: number;
    hookText?: string | null;
  }>
): Promise<{ success: boolean; importedCount: number }> {
  try {
    const alreadyImported = await isLegacyDataImported();
    if (alreadyImported) {
      return { success: true, importedCount: 0 };
    }

    let count = 0;
    for (const post of posts) {
      const platformPostId = post.platformPostId || post.id || `legacy_${Date.now()}_${count}`;
      const saved = await upsertResearchPost({
        platform: 'TIKTOK',
        platformPostId,
        authorHandle: post.authorHandle.replace(/^@/, ''),
        caption: post.caption,
        viewCount: post.viewCount || 0,
        likeCount: post.likeCount || 0,
        commentCount: post.commentCount || 0,
        shareCount: post.shareCount || 0,
        outlierScore: post.outlierScore || 1.0,
        hookText: post.hookText || null,
      });
      if (saved) count++;
    }

    await prisma.systemSetting.upsert({
      where: { key: LEGACY_IMPORT_KEY },
      update: { value: 'true' },
      create: { key: LEGACY_IMPORT_KEY, value: 'true' },
    });

    return { success: true, importedCount: count };
  } catch {
    return { success: false, importedCount: 0 };
  }
}
