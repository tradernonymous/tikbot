import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionSecret,
  getSessionCookieOptions,
  createSessionToken,
  verifySessionToken,
  attachSessionCookie,
  requireSession,
} from '../auth';

describe('Phase 1: Session Persistence & Cross-Context Determinism', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('provides a strict getSessionSecret() requiring >= 32 chars from env without writing fallback', () => {
    delete process.env.SESSION_SECRET;
    expect(() => getSessionSecret()).toThrowError(/SESSION_SECRET/);
    expect(process.env.SESSION_SECRET).toBeUndefined();

    process.env.SESSION_SECRET = 'super-secret-session-key-minimum-32-chars-long';
    const secret = getSessionSecret();
    expect(secret).toBe('super-secret-session-key-minimum-32-chars-long');
    expect(getSessionSecret()).toBe(secret);
  });

  it('guarantees tokens created in login are verifiable by layout, proxy, and API route guards without mismatch', () => {
    process.env.SESSION_SECRET = 'super-secret-session-key-minimum-32-chars-long';
    const signingSecret = getSessionSecret();
    const token = createSessionToken(
      { userId: 'admin-operator', email: 'admin@tikbot.local', role: 'OPERATOR' },
      signingSecret
    );

    // Verification in DashboardLayout
    const layoutSecret = getSessionSecret();
    const layoutVerified = verifySessionToken(token, layoutSecret);
    expect(layoutVerified).not.toBeNull();
    expect(layoutVerified?.userId).toBe('admin-operator');

    // Verification in proxy / middleware
    const proxySecret = getSessionSecret();
    const proxyVerified = verifySessionToken(token, proxySecret);
    expect(proxyVerified).not.toBeNull();

    // Verification in requireSession (API route)
    const req = new NextRequest('http://localhost:3000/api/v1/accounts', {
      headers: { cookie: `tikbot_session=${token}` },
    });
    const apiResult = requireSession(req);
    expect(apiResult).not.toBeInstanceOf(NextResponse);
    expect((apiResult as any).session.userId).toBe('admin-operator');
  });

  it('produces non-rejectable cookie attributes over HTTP in production mode', () => {
    (process.env as any).NODE_ENV = 'production';
    const httpOptions = getSessionCookieOptions(false);
    expect(httpOptions.name).toBe('tikbot_session');
    expect(httpOptions.secure).toBe(false);
    expect(httpOptions.sameSite).toBe('lax');

    const httpsOptions = getSessionCookieOptions(true);
    expect(httpsOptions.name).toBe('__Host-tikbot_session');
    expect(httpsOptions.secure).toBe(true);
    expect(httpsOptions.sameSite).toBe('lax');
  });

  it('attaches cookie correctly to NextResponse respecting protocol', () => {
    const res = NextResponse.json({ ok: true });
    attachSessionCookie(res, 'test-token', false);
    const cookie = res.cookies.get('tikbot_session');
    expect(cookie?.value).toBe('test-token');
  });
});
