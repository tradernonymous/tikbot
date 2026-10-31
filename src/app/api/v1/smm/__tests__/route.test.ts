import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { createSessionToken } from '@/security/auth';
import { SMMProviderAdapter } from '@/panel/smm-provider';

vi.mock('@/storage/system-settings', () => ({
  getSystemSetting: vi.fn().mockResolvedValue(null),
  setSystemSetting: vi.fn().mockResolvedValue(undefined),
}));

describe('SMM Provider Route Hardening (S5, S10, B7)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';
  let validToken: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SESSION_SECRET = secret;
    process.env.SMM_PROVIDER_URL = 'https://supplierfollower.com/api/v2';
    process.env.SMM_PROVIDER_API_KEY = 'server_configured_smm_key_999';
    validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeRequest(body: any, cookieToken?: string): NextRequest {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    };
    if (cookieToken) {
      headers['cookie'] = `tikbot_session=${cookieToken}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/smm', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  it('rejects unauthenticated requests with 401', async () => {
    const res = await POST(makeRequest({ action: 'balance' }));
    expect(res.status).toBe(401);
  });

  it('rejects request with 400 when apiUrl is supplied in body (SSRF prevention)', async () => {
    const res = await POST(
      makeRequest(
        {
          action: 'balance',
          apiUrl: 'https://169.254.169.254',
        },
        validToken
      )
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('apiUrl');
  });

  it('rejects request with 400 when apiKey is supplied in body (client key leak prevention)', async () => {
    const res = await POST(
      makeRequest(
        {
          action: 'balance',
          apiKey: 'client_leaked_key',
        },
        validToken
      )
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('apiKey');
  });

  it('rejects request with 400 when action is missing', async () => {
    const res = await POST(makeRequest({}, validToken));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 for order action when required fields are missing', async () => {
    const res = await POST(
      makeRequest(
        {
          action: 'order',
          service: '12886',
        },
        validToken
      )
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('link');
  });

  it('rejects request if server configured URL is invalid or not https', async () => {
    process.env.SMM_PROVIDER_URL = 'http://insecure-http-provider.com/api/v2';
    const res = await POST(makeRequest({ action: 'balance' }, validToken));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('https');
  });

  it('rejects request if server configured URL is not in allowlist', async () => {
    process.env.SMM_PROVIDER_URL = 'https://malicious-provider.attacker.com/api/v2';
    const res = await POST(makeRequest({ action: 'balance' }, validToken));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('allowed');
  });

  it('returns 400 if SMM_PROVIDER_API_KEY is not configured on server', async () => {
    delete process.env.SMM_PROVIDER_API_KEY;
    const res = await POST(makeRequest({ action: 'balance' }, validToken));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('not configured on server');
  });

  it('handles balance query successfully', async () => {
    vi.spyOn(SMMProviderAdapter.prototype, 'getBalance').mockResolvedValue({
      balance: 142.5,
      currency: 'USD',
    });

    const res = await POST(makeRequest({ action: 'balance' }, validToken));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.balance).toEqual({ balance: 142.5, currency: 'USD' });
  });

  it('handles order placement successfully', async () => {
    vi.spyOn(SMMProviderAdapter.prototype, 'createExternalOrder').mockResolvedValue({
      externalOrderId: '12345',
    });

    const res = await POST(
      makeRequest(
        {
          action: 'order',
          service: '12886',
          link: 'https://tiktok.com/@creator/video/12345',
          quantity: 1000,
        },
        validToken
      )
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.externalOrderId).toBe('12345');
  });

  it('attaches sliding session cookie when token has less than 2 hours remaining', async () => {
    vi.spyOn(SMMProviderAdapter.prototype, 'getBalance').mockResolvedValue({
      balance: 10,
      currency: 'USD',
    });

    // 1 hour remaining (< 2h)
    const expiringSoonToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      3600 * 1000
    );

    const res = await POST(makeRequest({ action: 'balance' }, expiringSoonToken));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('tikbot_session=');
  });

  it('deduplicates identical order submissions within window to prevent double charges (P9)', async () => {
    const createOrderSpy = vi.spyOn(SMMProviderAdapter.prototype, 'createExternalOrder').mockResolvedValue({
      externalOrderId: 'ext-dedupe-1',
    });

    const orderPayload = {
      action: 'order',
      campaignId: 'camp-idemp-1',
      service: 5,
      link: 'https://tiktok.com/@creator/video/999',
      quantity: 500,
    };

    // First call
    const res1 = await POST(makeRequest(orderPayload, validToken));
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.order.externalOrderId).toBe('ext-dedupe-1');
    expect(createOrderSpy).toHaveBeenCalledTimes(1);

    // Immediate second call with identical parameters
    const res2 = await POST(makeRequest(orderPayload, validToken));
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.deduplicated).toBe(true);
    expect(data2.order.externalOrderId).toBe('ext-dedupe-1');
    // External API must NOT have been called a second time
    expect(createOrderSpy).toHaveBeenCalledTimes(1);
  });
});
