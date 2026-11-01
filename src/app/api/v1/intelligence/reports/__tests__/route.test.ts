import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    researchPost: {
      findMany: vi.fn(),
    },
    metricSample: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.6 Intelligence Reports REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/reports');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns aggregated 7/30/90-day reports with breakdowns', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        publishedAt: new Date(),
        viewCount: 10000,
        likeCount: 800,
        commentCount: 50,
        shareCount: 20,
        hookType: 'CONTRARIAN',
      },
    ];

    vi.mocked(prisma.researchPost.findMany).mockResolvedValue(mockPosts as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/reports?timeframe=30', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.report.timeframeDays).toBe(30);
    expect(body.breakdowns.byHook).toBeDefined();
    expect(body.provenance).toBe('live');
  });

  it('exports CSV report when format=csv is requested', async () => {
    vi.mocked(prisma.researchPost.findMany).mockResolvedValue([
      {
        id: 'post-1',
        publishedAt: new Date(),
        viewCount: 5000,
        likeCount: 400,
        commentCount: 20,
        shareCount: 10,
        hookType: 'QUESTION',
      } as any,
    ]);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/reports?timeframe=7&format=csv', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('HookType');
    expect(text).toContain('QUESTION');
  });
});
