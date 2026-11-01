import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    trendSignal: {
      findMany: vi.fn(),
    },
    sound: {
      findMany: vi.fn(),
    },
  },
}));

describe('W1.1 Trends Intelligence REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/trends');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('validates query parameters with zod and returns trends with lifecycle phase', async () => {
    const mockSignals = [
      {
        id: 'ts-1',
        type: 'SOUND',
        signalKey: 'original-sound-123',
        score: 85,
        velocity: 28,
        sampleSize: 150,
        region: 'US',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
      {
        id: 'ts-2',
        type: 'HASHTAG',
        signalKey: '#dropshipping',
        score: 92,
        velocity: 40,
        sampleSize: 500,
        region: 'US',
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    ];

    vi.mocked(prisma.trendSignal.findMany).mockResolvedValue(mockSignals as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/trends?type=ALL&region=US', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.trends).toHaveLength(2);
    expect(body.provenance).toBe('live');
    expect(body.trends[0].lifecyclePhase).toBe('RISING');
  });

  it('rejects invalid limit query parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/trends?limit=9999', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
