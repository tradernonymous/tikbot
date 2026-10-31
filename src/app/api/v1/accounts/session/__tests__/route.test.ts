import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/security/crypto';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformAccount: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Account Session Vault Route (S8)', () => {
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

  function makeRequest(body: any, token?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (token) {
      headers['cookie'] = `tikbot_session=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/accounts/session', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(
      makeRequest({ accountId: 'acc-1', cookiesJson: '[{"name":"sessionid","value":"123"}]' })
    );
    expect(res.status).toBe(401);
  });

  it('rejects missing accountId or cookiesJson with 400', async () => {
    const res1 = await POST(makeRequest({ accountId: 'acc-1' }, validToken));
    expect(res1.status).toBe(400);

    const res2 = await POST(makeRequest({ cookiesJson: '[]' }, validToken));
    expect(res2.status).toBe(400);
  });

  it('encrypts cookies with encryptSecret, writes to DB, and returns only hasSession=true', async () => {
    const plaintextCookies = JSON.stringify([
      { name: 'sessionid', value: 'secret_tiktok_session_value_xyz' },
    ]);

    const res = await POST(
      makeRequest(
        {
          accountId: 'acc-1',
          username: 'farm_creator_01',
          platform: 'TIKTOK',
          cookiesJson: plaintextCookies,
        },
        validToken
      )
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.accountId).toBe('acc-1');
    expect(data.hasSession).toBe(true);

    // Verify response contains NO plaintext cookie data
    expect(JSON.stringify(data)).not.toContain('secret_tiktok_session_value_xyz');
    expect(JSON.stringify(data)).not.toContain('sessionid');

    // Verify DB write
    expect(prisma.platformAccount.upsert).toHaveBeenCalled();
    const upsertCall = vi.mocked(prisma.platformAccount.upsert).mock.calls[0][0];
    const encryptedInDb = upsertCall.update.encryptedCookies as string;

    expect(encryptedInDb).toBeDefined();
    expect(encryptedInDb).not.toBe(plaintextCookies);

    // Decrypting stored envelope recovers plaintext cookies
    const decrypted = decryptSecret(encryptedInDb, masterKey);
    expect(decrypted).toBe(plaintextCookies);
  });
});
