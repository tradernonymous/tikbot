import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAccount: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Accounts API Route (P3)', () => {
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
    const url = `http://localhost:3000/api/v1/accounts${query ? `?${query}` : ''}`;
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

  it('GET returns accounts from database', async () => {
    vi.mocked(prisma.platformAccount.findMany).mockResolvedValue([
      {
        id: 'acc-1',
        username: 'creator_1',
        platform: 'TIKTOK',
        status: 'ACTIVE',
        healthScore: 100,
        actionsToday: 0,
        dailyCap: 80,
        lastActiveAt: null,
        proxyId: null,
        encryptedCookies: null,
        encryptedPassword: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        proxy: null,
      } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.accounts).toHaveLength(1);
    expect(data.accounts[0].username).toBe('creator_1');
  });

  it('POST validates input and creates an account', async () => {
    vi.mocked(prisma.platformAccount.create).mockResolvedValue({
      id: 'acc-new',
      username: 'creator_new',
      platform: 'TIKTOK',
      status: 'CREATED',
      healthScore: 100,
      actionsToday: 0,
      dailyCap: 80,
      lastActiveAt: null,
      proxyId: null,
      encryptedCookies: null,
      encryptedPassword: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      proxy: null,
    } as any);

    const res = await POST(makeRequest('POST', { username: 'creator_new', platform: 'TIKTOK' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.account.username).toBe('creator_new');
  });

  it('DELETE removes account from database', async () => {
    vi.mocked(prisma.platformAccount.delete).mockResolvedValue({ id: 'acc-1' } as any);
    const res = await DELETE(makeRequest('DELETE', undefined, 'id=acc-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(prisma.platformAccount.delete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
  });
});
