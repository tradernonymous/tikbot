import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    metricSample: {
      findMany: vi.fn(),
    },
  },
}));

describe('R2.2 Metric Series REST API Endpoint', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/metrics/series?targetType=RESEARCH_POST&targetId=post-1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('rejects with 400 when targetType or targetId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/metrics/series', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns metric samples series for a target entity', async () => {
    vi.mocked(prisma.metricSample.findMany).mockResolvedValue([
      {
        id: 'sample-1',
        targetType: 'RESEARCH_POST',
        targetId: 'post-1',
        views: 1000,
        likes: 200,
        comments: 10,
        shares: 5,
        timestamp: new Date('2026-10-31T01:00:00Z'),
        researchPostId: 'post-1',
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/v1/metrics/series?targetType=RESEARCH_POST&targetId=post-1', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.series)).toBe(true);
    expect(body.series.length).toBe(1);
    expect(body.series[0].views).toBe(1000);
  });
});
