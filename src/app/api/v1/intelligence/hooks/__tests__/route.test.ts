import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    hook: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    researchPost: {
      count: vi.fn(),
    },
  },
}));

describe('W1.2 Hook Lab REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/hooks');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists hooks with usage counts and retention scores', async () => {
    const mockHooks = [
      {
        id: 'h-1',
        pattern: 'CONTRARIAN',
        textTemplate: 'Stop doing {action} until you watch this.',
        retentionProxyScore: 84.5,
        usageCount: 12,
        createdAt: new Date(),
      },
    ];

    vi.mocked(prisma.hook.findMany).mockResolvedValue(mockHooks as any);

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/hooks?pattern=CONTRARIAN', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.hooks).toHaveLength(1);
    expect(body.provenance).toBe('live');
  });

  it('generates hook variants from a base idea in POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/hooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'generate',
        baseText: 'how to fix low views on TikTok',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.variants).toHaveLength(4);
    expect(body.variants.some((v: any) => v.type === 'CONTRARIAN')).toBe(true);
  });

  it('evaluates AB test variants in POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/hooks', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'evaluate',
        variantA: { id: 'var-a', views: 5000, retentionRate: 0.2 },
        variantB: { id: 'var-b', views: 5000, retentionRate: 0.35 },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.evaluation.winnerId).toBe('var-b');
    expect(body.evaluation.isSignificant).toBe(true);
  });
});
