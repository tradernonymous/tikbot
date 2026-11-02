import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { POST as loginPost } from '@/app/api/v1/auth/login/route';
import { POST as logoutPost } from '@/app/api/v1/auth/logout/route';
import { POST as accountsPost } from '@/app/api/v1/accounts/route';
import { createSessionToken, getSessionSecret, requireSession } from '@/security/auth';
import { isTokenRevoked, clearRevocations } from '@/security/session-revocation';
import { loadConfig } from '@/config';

describe('0.11 Failure-Path and Security Invariant Tests', () => {
  const validSecret = 'a-super-long-secure-session-secret-at-least-32-chars';

  beforeEach(() => {
    process.env.SESSION_SECRET = validSecret;
    clearRevocations();
  });

  it('1. Missing secret boot failure: loadConfig throws in production when secrets missing', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/tikbot',
        // Missing MASTER_ENCRYPTION_KEY and SESSION_SECRET
      })
    ).toThrowError(/Configuration Validation Error/);
  });

  it('2. Logout revocation honored: logging out renders the session token revoked', async () => {
    const token = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      validSecret
    );

    const logoutReq = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        cookie: `tikbot_session=${token}`,
      },
    });

    const logoutRes = await logoutPost(logoutReq);
    expect(logoutRes.status).toBe(200);

    const revoked = await isTokenRevoked(token);
    expect(revoked).toBe(true);

    const apiReq = new NextRequest('http://localhost:3000/api/v1/accounts', {
      headers: {
        cookie: `tikbot_session=${token}`,
      },
    });

    const guardRes = await requireSession(apiReq);
    expect((guardRes as any).status).toBe(401);
  });

  it('3. Rapid-create uniqueness: 100+ generated UUIDs have zero collisions', () => {
    const idSet = new Set<string>();
    const count = 120;
    for (let i = 0; i < count; i++) {
      idSet.add(crypto.randomUUID());
    }
    expect(idSet.size).toBe(count);
  });

  it('4. Malformed payload rejected: login route rejects non-JSON body with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      body: 'invalid-non-json-body',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await loginPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('5. Malformed payload rejected: accounts route rejects malformed schema with 400', async () => {
    const token = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      validSecret
    );

    const req = new NextRequest('http://localhost:3000/api/v1/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `tikbot_session=${token}`,
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({}), // Missing required 'username'
    });

    const res = await accountsPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/username/i);
  });
});
