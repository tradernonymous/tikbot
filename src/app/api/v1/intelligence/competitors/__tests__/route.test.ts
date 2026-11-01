import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    watchlist: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    watchlistTarget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    creator: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    researchPost: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.4 Competitors Intelligence REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/competitors');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists competitors and outlier posts with own-baseline scoring', async () => {
    const mockTargets = [
      {
        id: 'target-1',
        watchlistId: 'wl-1',
        platform: 'TIKTOK',
        targetHandle: 'growth_rival',
        pollIntervalHours: 24,
        lastPolledAt: new Date(),
        createdAt: new Date(),
        creator: {
          id: 'c-1',
          handle: 'growth_rival',
          followerCount: 250000,
          videoCount: 85,
          medianViews: 45000,
          madViews: 8000,
          sampleSize: 30,
        },
      },
    ];

    vi.mocked(prisma.watchlistTarget.findMany).mockResolvedValue(mockTargets as any);
    vi.mocked(prisma.researchPost.findMany).mockResolvedValue([
      {
        id: 'post-outlier-1',
        platform: 'TIKTOK',
        platformPostId: '888123',
        authorHandle: 'growth_rival',
        caption: 'Why 99% fail at content',
        viewCount: 450000,
        likeCount: 65000,
        commentCount: 1200,
        shareCount: 450,
        hookText: 'Stop making this mistake',
        hookType: 'CONTRARIAN',
        outlierScore: 10.0,
        medianBaseline: 45000,
      } as any,
    ]);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/competitors', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.targets).toHaveLength(1);
    expect(body.outliers).toHaveLength(1);
    expect(body.provenance).toBe('live');
  });

  it('adds a new competitor to watchlist in POST', async () => {
    vi.mocked(prisma.watchlist.findFirst).mockResolvedValue({ id: 'default-wl', name: 'Default' } as any);
    vi.mocked(prisma.creator.upsert).mockResolvedValue({ id: 'c-new', handle: 'new_competitor' } as any);
    vi.mocked(prisma.watchlistTarget.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.watchlistTarget.create).mockResolvedValue({
      id: 'target-new',
      watchlistId: 'default-wl',
      targetHandle: 'new_competitor',
      platform: 'TIKTOK',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/competitors', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'add',
        handle: 'new_competitor',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.target.targetHandle).toBe('new_competitor');
  });

  it('removes a competitor target in DELETE', async () => {
    vi.mocked(prisma.watchlistTarget.delete).mockResolvedValue({ id: 'target-1' } as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/competitors?id=target-1', {
      method: 'DELETE',
      headers: {
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.watchlistTarget.delete).toHaveBeenCalledWith({
      where: { id: 'target-1' },
    });
  });
});
