import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    creator: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    researchPost: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.5 Creators CRM REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/creators');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists creators with CRM pipeline stage and vetting scores', async () => {
    const mockCreators = [
      {
        id: 'creator-1',
        platform: 'TIKTOK',
        handle: 'ugc_star',
        followerCount: 85000,
        videoCount: 120,
        medianViews: 25000,
        madViews: 4000,
        sampleSize: 20,
        createdAt: new Date(),
      },
    ];

    vi.mocked(prisma.creator.findMany).mockResolvedValue(mockCreators as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/creators', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.creators).toHaveLength(1);
    expect(body.creators[0].stage).toBeDefined();
    expect(body.creators[0].vettingScore).toBeGreaterThanOrEqual(0);
    expect(body.provenance).toBe('live');
  });

  it('updates creator pipeline stage in PATCH', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/creators', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        creatorId: 'creator-1',
        stage: 'NEGOTIATING',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stage).toBe('NEGOTIATING');
  });
});
