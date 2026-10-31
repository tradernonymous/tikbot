import { prisma } from '@/lib/prisma';
import type { QueryResearchPostsInput, CreateResearchPostInput } from './research.schemas';

export interface PublicResearchPostDTO {
  id: string;
  platform: string;
  platformPostId: string;
  authorHandle: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hookText: string | null;
  hookType: string | null;
  outlierScore: number;
  medianBaseline: number | null;
  confidence: number | null;
  publishedAt: string | null;
  createdAt: string;
}

export async function listResearchPosts(
  query: QueryResearchPostsInput
): Promise<{ posts: PublicResearchPostDTO[]; nextCursor: string | null }> {
  try {
    const where: any = {};
    if (query.minOutlierScore !== undefined && query.minOutlierScore > 0) {
      where.outlierScore = { gte: query.minOutlierScore };
    }
    if (query.authorHandle) {
      where.authorHandle = { contains: query.authorHandle, mode: 'insensitive' };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'outlier') {
      orderBy = { outlierScore: 'desc' };
    } else if (query.sort === 'views') {
      orderBy = { viewCount: 'desc' };
    }

    const take = query.limit + 1;
    const findArgs: any = {
      where,
      orderBy,
      take,
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1;
    }

    const rows = await prisma.researchPost.findMany(findArgs);

    let nextCursor: string | null = null;
    let results = rows;
    if (rows.length > query.limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem ? nextItem.id : null;
      results = rows;
    }

    const posts = results.map((r) => ({
      id: r.id,
      platform: r.platform,
      platformPostId: r.platformPostId,
      authorHandle: r.authorHandle,
      caption: r.caption,
      viewCount: r.viewCount,
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      shareCount: r.shareCount,
      hookText: r.hookText,
      hookType: r.hookType,
      outlierScore: r.outlierScore,
      medianBaseline: r.medianBaseline,
      confidence: r.confidence,
      publishedAt: r.publishedAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
    }));

    return { posts, nextCursor };
  } catch {
    return { posts: [], nextCursor: null };
  }
}

export async function upsertResearchPost(
  input: CreateResearchPostInput
): Promise<PublicResearchPostDTO | null> {
  try {
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : undefined;
    const row = await prisma.researchPost.upsert({
      where: {
        platform_platformPostId: {
          platform: input.platform,
          platformPostId: input.platformPostId,
        },
      },
      update: {
        caption: input.caption,
        viewCount: input.viewCount,
        likeCount: input.likeCount,
        commentCount: input.commentCount,
        shareCount: input.shareCount,
        hookText: input.hookText,
        hookType: input.hookType,
        outlierScore: input.outlierScore,
        medianBaseline: input.medianBaseline,
        confidence: input.confidence,
        ...(publishedAt ? { publishedAt } : {}),
      },
      create: {
        platform: input.platform,
        platformPostId: input.platformPostId,
        authorHandle: input.authorHandle,
        caption: input.caption,
        viewCount: input.viewCount,
        likeCount: input.likeCount,
        commentCount: input.commentCount,
        shareCount: input.shareCount,
        hookText: input.hookText,
        hookType: input.hookType,
        outlierScore: input.outlierScore,
        medianBaseline: input.medianBaseline,
        confidence: input.confidence,
        publishedAt,
      },
    });

    // Automatically record first snapshot
    await prisma.postSnapshot.create({
      data: {
        postId: row.id,
        views: input.viewCount,
        likes: input.likeCount,
        comments: input.commentCount,
        shares: input.shareCount,
      },
    });

    return {
      id: row.id,
      platform: row.platform,
      platformPostId: row.platformPostId,
      authorHandle: row.authorHandle,
      caption: row.caption,
      viewCount: row.viewCount,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      shareCount: row.shareCount,
      hookText: row.hookText,
      hookType: row.hookType,
      outlierScore: row.outlierScore,
      medianBaseline: row.medianBaseline,
      confidence: row.confidence,
      publishedAt: row.publishedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}
