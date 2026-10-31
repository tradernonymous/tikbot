import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    proxy: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Proxies API Route (P3)', () => {
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
    const url = `http://localhost:3000/api/v1/proxies${query ? `?${query}` : ''}`;
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

  it('GET lists proxies from database', async () => {
    vi.mocked(prisma.proxy.findMany).mockResolvedValue([
      {
        id: 'prx-1',
        protocol: 'HTTP',
        host: '1.2.3.4',
        port: 8080,
        username: null,
        encryptedPassword: null,
        country: 'US',
        latencyMs: 120,
        status: 'HEALTHY',
        consecutiveErrors: 0,
        lastCheckedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.proxies).toHaveLength(1);
    expect(data.proxies[0].host).toBe('1.2.3.4');
  });

  it('POST creates proxy in database', async () => {
    vi.mocked(prisma.proxy.create).mockResolvedValue({
      id: 'prx-new',
      protocol: 'HTTP',
      host: '5.6.7.8',
      port: 9000,
      username: null,
      encryptedPassword: null,
      country: 'SG',
      latencyMs: null,
      status: 'HEALTHY',
      consecutiveErrors: 0,
      lastCheckedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(makeRequest('POST', { host: '5.6.7.8', port: 9000, country: 'SG' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.proxy.host).toBe('5.6.7.8');
  });

  it('DELETE removes proxy', async () => {
    vi.mocked(prisma.proxy.delete).mockResolvedValue({ id: 'prx-1' } as any);
    const res = await DELETE(makeRequest('DELETE', undefined, 'id=prx-1'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
