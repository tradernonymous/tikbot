import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    researchPost: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    postSnapshot: {
      create: vi.fn(),
    },
  },
}));

describe('R2.2 Research Posts REST API Endpoints', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/research/posts');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('validates query parameters with zod and rejects invalid limit', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/research/posts?limit=-5', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('limit');
  });

  it('returns posts list with pagination cursor', async () => {
    vi.mocked(prisma.researchPost.findMany).mockResolvedValue([
      {
        id: 'post-1',
        platform: 'TIKTOK',
        platformPostId: '721839210',
        authorHandle: 'viral_creator',
        caption: 'How to scale to 10k views',
        viewCount: 150000,
        likeCount: 30000,
        commentCount: 400,
        shareCount: 50,
        hookText: 'Stop making this mistake',
        hookType: 'CONTRARIAN',
        outlierScore: 4.5,
        medianBaseline: 30000,
        confidence: 0.9,
        publishedAt: new Date('2026-10-30T10:00:00Z'),
        createdAt: new Date('2026-10-31T12:00:00Z'),
        updatedAt: new Date('2026-10-31T12:00:00Z'),
        creatorId: null,
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/v1/research/posts?limit=10', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.posts)).toBe(true);
    expect(body.posts.length).toBe(1);
    expect(body.posts[0].authorHandle).toBe('viral_creator');
  });

  it('rejects POST with 400 when missing required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/research/posts', {
      method: 'POST',
      headers: {
        cookie: `tikbot_session=${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform: 'TIKTOK' }), // missing platformPostId, authorHandle, caption
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST successfully upserts a research post and returns 200', async () => {
    vi.mocked(prisma.researchPost.upsert).mockResolvedValue({
      id: 'post-100',
      platform: 'TIKTOK',
      platformPostId: '999888',
      authorHandle: 'growth_expert',
      caption: 'The secret to TikTok viral hooks',
      viewCount: 200000,
      likeCount: 45000,
      commentCount: 600,
      shareCount: 120,
      hookText: 'Nobody talks about this',
      hookType: 'SECRET',
      outlierScore: 5.2,
      medianBaseline: 40000,
      confidence: 0.95,
      publishedAt: new Date('2026-10-30T10:00:00Z'),
      createdAt: new Date('2026-10-31T12:00:00Z'),
      updatedAt: new Date('2026-10-31T12:00:00Z'),
      creatorId: null,
    });
    vi.mocked(prisma.postSnapshot.create).mockResolvedValue({
      id: 'snap-1',
      postId: 'post-100',
      views: 200000,
      likes: 45000,
      comments: 600,
      shares: 120,
      capturedAt: new Date(),
    });

    const req = new NextRequest('http://localhost:3000/api/v1/research/posts', {
      method: 'POST',
      headers: {
        cookie: `tikbot_session=${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform: 'TIKTOK',
        platformPostId: '999888',
        authorHandle: 'growth_expert',
        caption: 'The secret to TikTok viral hooks',
        viewCount: 200000,
        likeCount: 45000,
        commentCount: 600,
        shareCount: 120,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.post.id).toBe('post-100');
  });
});
