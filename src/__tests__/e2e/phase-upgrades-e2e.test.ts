import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginRoute } from '@/app/api/v1/auth/login/route';
import { GET as settingsGetRoute, POST as settingsPostRoute } from '@/app/api/v1/system/settings/route';
import { SMMIdempotencyManager } from '@/panel/smm-idempotency';
import { QueueSafetyLockManager } from '@/queue/safety-lock';
import { encryptSecret, decryptSecret } from '@/security/crypto';
import { createSessionToken } from '@/security/auth';
import { prisma } from '@/lib/prisma';

const settingsStore = new Map<string, string>();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn().mockImplementation(({ where: { key } }: any) => {
        const val = settingsStore.get(key);
        return Promise.resolve(val !== undefined ? { key, value: val } : null);
      }),
      findMany: vi.fn().mockImplementation(() => {
        return Promise.resolve(
          Array.from(settingsStore.entries()).map(([key, value]) => ({ key, value }))
        );
      }),
      upsert: vi.fn().mockImplementation(({ where: { key }, update, create }: any) => {
        const val = update?.value || create?.value;
        settingsStore.set(key, val);
        return Promise.resolve({ key, value: val });
      }),
      delete: vi.fn().mockImplementation(({ where: { key } }: any) => {
        settingsStore.delete(key);
        return Promise.resolve({ key });
      }),
    },
    accountActionLedger: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'ledger-1' }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

describe('Integrated System Verification — Upgraded Security & Persistence Flow', () => {
  const masterKey = '0123456789abcdef0123456789abcdef';
  const sessionSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    process.env.MASTER_ENCRYPTION_KEY = masterKey;
    process.env.SESSION_SECRET = sessionSecret;
    process.env.ADMIN_PASSWORD = 'CorrectSecureOperatorPassword123!';
    settingsStore.clear();
    vi.clearAllMocks();
  });

  it('Flow 1: Operator login requires valid configured password and returns hardened session token', async () => {
    // Attempt with incorrect password
    const badReq = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong-password' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const badRes = await loginRoute(badReq);
    expect(badRes.status).toBe(401);

    // Attempt with correct password
    const goodReq = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'CorrectSecureOperatorPassword123!' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const goodRes = await loginRoute(goodReq);
    expect(goodRes.status).toBe(200);
    const body = await goodRes.json();
    expect(body.success).toBe(true);
    expect(goodRes.headers.get('set-cookie')).toBeDefined();
    expect(goodRes.headers.get('set-cookie')).toContain('tikbot_session=');
  });

  it('Flow 2: Sensitive system settings are encrypted with AES-256-GCM and never returned in plaintext', async () => {
    const validToken = createSessionToken(
      { userId: 'admin', email: 'operator@tikbot.local', role: 'ADMIN' },
      sessionSecret,
      8 * 3600
    );

    // POST /api/v1/system/settings with sensitive key
    const postReq = new NextRequest('http://localhost:3000/api/v1/system/settings', {
      method: 'POST',
      body: JSON.stringify({
        key: 'SMM_PROVIDER_API_KEY',
        value: 'secret-api-key-value-12345',
      }),
      headers: {
        'Content-Type': 'application/json',
        cookie: `tikbot_session=${validToken}`,
        origin: 'http://localhost:3000',
      },
    });

    const postRes = await settingsPostRoute(postReq);
    expect(postRes.status).toBe(200);

    // Verify stored DB setting is encrypted, not plaintext
    const stored = settingsStore.get('SMM_PROVIDER_API_KEY');
    expect(stored).toBeDefined();
    expect(stored).not.toContain('secret-api-key-value-12345');
    expect(decryptSecret(stored!, masterKey)).toBe('secret-api-key-value-12345');

    // Verify GET never returns the secret in plaintext
    const getReq = new NextRequest('http://localhost:3000/api/v1/system/settings', {
      method: 'GET',
      headers: {
        cookie: `tikbot_session=${validToken}`,
      },
    });

    const getRes = await settingsGetRoute(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.settings.SMM_PROVIDER_API_KEY.configured).toBe(true);
    expect(getBody.settings.SMM_PROVIDER_API_KEY.value).toBeUndefined();
  });

  it('Flow 3: Paid SMM order idempotency manager prevents duplicate charges', async () => {
    const idempotency = new SMMIdempotencyManager();
    const params = {
      campaignId: 'camp-100',
      service: '12886',
      link: 'https://tiktok.com/@growth/video/999',
      quantity: 1000,
    };

    const key = idempotency.generateKey(params);
    const firstCheck = await idempotency.checkAndLock(key);
    expect(firstCheck.isDuplicate).toBe(false);
    expect(firstCheck.lockAcquired).toBe(true);

    // Mark as completed with external order ID
    await idempotency.recordSuccess(key, { externalOrderId: 'ext-order-1' });

    // Immediate second attempt within deduplication window
    const secondCheck = await idempotency.checkAndLock(key);
    expect(secondCheck.isDuplicate).toBe(true);
    expect(secondCheck.lockAcquired).toBe(false);
    expect((secondCheck.existingResult as any)?.externalOrderId).toBe('ext-order-1');
  });

  it('Flow 4: Queue safety lock prevents concurrent task collisions on identical accounts', async () => {
    const safetyLock = new QueueSafetyLockManager();
    const acquiredFirst = await safetyLock.acquireAccountLock('farm-node-99', 'worker-1');
    expect(acquiredFirst).toBe(true);

    // Second worker attempting to lock same account is rejected
    const acquiredSecond = await safetyLock.acquireAccountLock('farm-node-99', 'worker-2');
    expect(acquiredSecond).toBe(false);

    // Release lock allows next job to acquire
    await safetyLock.releaseAccountLock('farm-node-99', 'worker-1');
    const acquiredThird = await safetyLock.acquireAccountLock('farm-node-99', 'worker-2');
    expect(acquiredThird).toBe(true);
  });
});
