import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('System Settings API Route (S7)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  let validToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = secret;
    process.env.MASTER_ENCRYPTION_KEY = masterKey;
    validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  function makeRequest(method: 'GET' | 'POST', body?: any, token?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (token) {
      headers['cookie'] = `tikbot_session=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/system/settings', {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it('rejects unauthenticated requests with 401', async () => {
    const getRes = await GET(makeRequest('GET'));
    expect(getRes.status).toBe(401);

    const postRes = await POST(makeRequest('POST', { key: 'SMM_PROVIDER_API_KEY', value: 'secret' }));
    expect(postRes.status).toBe(401);
  });

  it('GET never exposes the SMM_PROVIDER_API_KEY value', async () => {
    vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
      { key: 'SMM_PROVIDER_API_KEY', value: 'some-encrypted-envelope', updatedAt: new Date() },
    ]);

    const res = await GET(makeRequest('GET', undefined, validToken));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.settings.SMM_PROVIDER_API_KEY.configured).toBe(true);
    expect(data.settings.SMM_PROVIDER_API_KEY.value).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain('some-encrypted-envelope');
  });

  it('POST validates input and persists encrypted setting without leaking value in response', async () => {
    const rawSecretKey = 'my-super-secret-smm-api-key-value';
    const res = await POST(
      makeRequest(
        'POST',
        {
          key: 'SMM_PROVIDER_API_KEY',
          value: rawSecretKey,
        },
        validToken
      )
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.configured).toBe(true);
    // Value must not be in response
    expect(JSON.stringify(data)).not.toContain(rawSecretKey);

    expect(prisma.systemSetting.upsert).toHaveBeenCalled();
    const upsertArgs = vi.mocked(prisma.systemSetting.upsert).mock.calls[0][0];
    expect(upsertArgs.where.key).toBe('SMM_PROVIDER_API_KEY');
    expect(upsertArgs.update.value).not.toBe(rawSecretKey);
  });

  it('POST rejects invalid setting keys with 400', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        {
          key: 'UNKNOWN_OR_UNALLOWED_KEY',
          value: 'value',
        },
        validToken
      )
    );
    expect(res.status).toBe(400);
  });
});
