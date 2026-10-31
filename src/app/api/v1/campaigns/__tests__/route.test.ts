import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PATCH, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Campaigns API Route (P3)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = secret;
    validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  function makeRequest(method: string, body?: any, query?: string): NextRequest {
    const url = `http://localhost:3000/api/v1/campaigns${query ? `?${query}` : ''}`;
    return new NextRequest(url, {
      method,
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        cookie: `tikbot_session=${validToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it('GET lists campaigns from database', async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: 'camp-1',
        title: 'Campaign 1',
        targetUrl: 'https://tiktok.com/@user/1',
        actionType: 'VIEW',
        targetCount: 500,
        executedCount: 100,
        status: 'RUNNING',
        approvalId: null,
        metadata: null,
        startedAt: null,
        finishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        actions: [],
      } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].title).toBe('Campaign 1');
  });

  it('POST creates new campaign', async () => {
    vi.mocked(prisma.campaign.create).mockResolvedValue({
      id: 'camp-2',
      title: 'Campaign 2',
      targetUrl: 'https://tiktok.com/@user/2',
      actionType: 'LIKE',
      targetCount: 100,
      executedCount: 0,
      status: 'PENDING_APPROVAL',
      approvalId: null,
      metadata: null,
      startedAt: null,
      finishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      makeRequest('POST', {
        title: 'Campaign 2',
        targetUrl: 'https://tiktok.com/@user/2',
        actionType: 'LIKE',
        targetCount: 100,
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.campaign.id).toBe('camp-2');
  });

  it('PATCH updates campaign status', async () => {
    vi.mocked(prisma.campaign.update).mockResolvedValue({ id: 'camp-1' } as any);
    const res = await PATCH(makeRequest('PATCH', { id: 'camp-1', status: 'PAUSED' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'camp-1' } })
    );
  });

  it('DELETE deletes campaign', async () => {
    vi.mocked(prisma.campaign.delete).mockResolvedValue({ id: 'camp-1' } as any);
    const res = await DELETE(makeRequest('DELETE', undefined, 'id=camp-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
