import { z } from 'zod';

export const queryResearchPostsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100').default(20),
  minOutlierScore: z.coerce.number().min(0).optional(),
  authorHandle: z.string().optional(),
  sort: z.enum(['outlier', 'recent', 'views']).default('recent'),
});

export const createResearchPostSchema = z.object({
  platform: z.string().default('TIKTOK'),
  platformPostId: z.string().min(1, 'platformPostId is required'),
  authorHandle: z.string().min(1, 'authorHandle is required'),
  caption: z.string(),
  viewCount: z.number().int().nonnegative().default(0),
  likeCount: z.number().int().nonnegative().default(0),
  commentCount: z.number().int().nonnegative().default(0),
  shareCount: z.number().int().nonnegative().default(0),
  hookText: z.string().optional().nullable(),
  hookType: z.string().optional().nullable(),
  outlierScore: z.number().default(1.0),
  medianBaseline: z.number().optional().nullable(),
  confidence: z.number().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export type QueryResearchPostsInput = z.infer<typeof queryResearchPostsSchema>;
export type CreateResearchPostInput = z.infer<typeof createResearchPostSchema>;
