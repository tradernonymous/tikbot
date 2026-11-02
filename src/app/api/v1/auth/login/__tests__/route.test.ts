import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { resetLoginRateLimiter } from '@/security/login-rate-limiter';
import { hashPassword } from '@/security/auth';

describe('Auth Login Route (S2, S9, S11)', () => {
  beforeEach(() => {
    resetLoginRateLimiter();
    delete process.env.ADMIN_PASSWORD;
    delete process.env.DASHBOARD_PASSWORD;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tikbot';
    process.env.MASTER_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.SESSION_SECRET = 'super-secret-session-key-minimum-32-chars-long';
    process.env.INTERNAL_API_SECRET = 'super-internal-api-secret-16-chars';
  });

  function makeRequest(body: any, ip = '127.0.0.1'): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(body),
    });
  }

  it('returns 400 when password is missing or empty', async () => {
    process.env.ADMIN_PASSWORD = 'strong_operator_password_123';
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Password is required');
  });

  it('returns 503 when operator credentials are not configured', async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.OPERATOR_PASSWORD_HASH;
    // Call with any password
    const res = await POST(makeRequest({ password: 'any_password' }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe('operator credentials not configured');
  });

  it('rejects incorrect password with 401 using timingSafeEqual', async () => {
    process.env.ADMIN_PASSWORD = 'super_secret_admin_pass';
    const res = await POST(makeRequest({ password: 'wrong_password' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid master credentials');
  });

  it('accepts correct ADMIN_PASSWORD and sets hardened cookie', async () => {
    process.env.ADMIN_PASSWORD = 'super_secret_admin_pass';
    const res = await POST(makeRequest({ password: 'super_secret_admin_pass' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('tikbot_session=');
    expect(setCookie?.toLowerCase()).toContain('httponly');
    expect(setCookie?.toLowerCase()).toContain('samesite=lax');
  });

  it('verifies scrypt OPERATOR_PASSWORD_HASH when ADMIN_PASSWORD is not set', async () => {
    const plain = 'scrypt_hashed_password_999';
    process.env.OPERATOR_PASSWORD_HASH = hashPassword(plain);

    const res = await POST(makeRequest({ password: plain }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('rate limits login after 5 failed attempts per IP', async () => {
    process.env.ADMIN_PASSWORD = 'correct_pass';
    const ip = '198.51.100.42';

    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ password: 'wrong' }, ip));
      expect(res.status).toBe(401);
    }

    const blocked = await POST(makeRequest({ password: 'wrong' }, ip));
    expect(blocked.status).toBe(429);
    const data = await blocked.json();
    expect(data.error).toContain('Too many login attempts');
  });
});
