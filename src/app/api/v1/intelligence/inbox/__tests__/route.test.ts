import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    contentPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('W1.3 Comment Inbox REST API', () => {
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
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/inbox');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('lists inbox items with categorization and sentiment scores', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/inbox?tab=pending', {
      headers: { cookie: `tikbot_session=${validToken}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.provenance).toBe('live');
  });

  it('escalates comment into a ContentPlan draft idea', async () => {
    vi.mocked(prisma.contentPlan.create).mockResolvedValue({
      id: 'cp-123',
      title: 'Comment Idea from @viewer_1',
      theme: 'QUESTION',
      hookPattern: null,
      captionDraft: 'How do you set up the proxy rotator?',
      status: 'IDEA',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new NextRequest('http://localhost:3000/api/v1/intelligence/inbox', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        action: 'escalate',
        text: 'How do you set up the proxy rotator?',
        authorHandle: 'viewer_1',
        category: 'QUESTION',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.contentPlan.id).toBe('cp-123');
    expect(prisma.contentPlan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'IDEA',
          theme: 'QUESTION',
        }),
      })
    );
  });
});
