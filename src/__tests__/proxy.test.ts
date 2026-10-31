import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { createSessionToken } from '@/security/auth';

describe('Next.js 16 Proxy Authentication (S4)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
  });

  function makeRequest(pathname: string, cookieToken?: string): NextRequest {
    const headers: Record<string, string> = {};
    if (cookieToken) {
      headers['cookie'] = `tikbot_session=${cookieToken}`;
    }
    return new NextRequest(`http://localhost:3000${pathname}`, {
      headers,
    });
  }

  it('allows public exempt paths like /api/health and /api/v1/auth/login', () => {
    const healthReq = makeRequest('/api/health');
    const healthRes = proxy(healthReq);
    expect(healthRes.headers.get('location')).toBeNull();
    expect(healthRes.status).toBe(200);

    const loginApiReq = makeRequest('/api/v1/auth/login');
    const loginApiRes = proxy(loginApiReq);
    expect(loginApiRes.status).toBe(200);
  });

  it('redirects unauthenticated browser requests on /dashboard to /login', () => {
    const req = makeRequest('/dashboard/panel');
    const res = proxy(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login?from=%2Fdashboard%2Fpanel');
  });

  it('redirects requests with invalid or expired tokens on /dashboard to /login', () => {
    const expiredToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      -1000 // expired
    );
    const req = makeRequest('/dashboard', expiredToken);
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('returns 401 JSON for unauthenticated /api routes', () => {
    const req = makeRequest('/api/v1/smm');
    const res = proxy(req);
    expect(res.status).toBe(401);
  });

  it('allows authenticated requests with valid session tokens through to dashboard and API', () => {
    const validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      3600 * 1000
    );
    const pageReq = makeRequest('/dashboard', validToken);
    const pageRes = proxy(pageReq);
    expect(pageRes.headers.get('location')).toBeNull();
    expect(pageRes.status).toBe(200);

    const apiReq = makeRequest('/api/v1/smm', validToken);
    const apiRes = proxy(apiReq);
    expect(apiRes.status).toBe(200);
  });

  it('redirects authenticated users visiting /login to /dashboard', () => {
    const validToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      3600 * 1000
    );
    const req = makeRequest('/login', validToken);
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });
});
