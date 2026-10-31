import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { requireSession, createSessionToken } from '../auth';

describe('requireSession Helper (S4, S10, S11)', () => {
  const secret = 'super-secret-session-key-minimum-32-chars-long';

  beforeEach(() => {
    process.env.SESSION_SECRET = secret;
  });

  function makeRequest(
    method = 'GET',
    cookieValue?: string,
    headers: Record<string, string> = {}
  ): NextRequest {
    const reqHeaders: Record<string, string> = { ...headers };
    if (cookieValue) {
      reqHeaders['cookie'] = `tikbot_session=${cookieValue}`;
    }
    return new NextRequest('http://localhost:3000/api/v1/system/kill-switch', {
      method,
      headers: reqHeaders,
    });
  }

  it('returns 401 response when session cookie is missing', () => {
    const req = makeRequest('GET');
    const result = requireSession(req, secret);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 response when session token signature is invalid', () => {
    const req = makeRequest('GET', 'invalid.token.structure');
    const result = requireSession(req, secret);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 response when session token is expired', () => {
    const expiredToken = createSessionToken(
      { userId: 'admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      -1000 // expired 1s ago
    );
    const req = makeRequest('GET', expiredToken);
    const result = requireSession(req, secret);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns valid session payload when session token is valid', () => {
    const validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      4 * 3600 * 1000
    );
    const req = makeRequest('GET', validToken);
    const result = requireSession(req, secret);
    expect(result).not.toBeInstanceOf(NextResponse);
    const { session } = result as { session: any };
    expect(session.userId).toBe('admin-1');
    expect(session.role).toBe('OPERATOR');
  });

  it('rejects mutating request with 403 on CSRF origin mismatch (S10)', () => {
    const validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      4 * 3600 * 1000
    );
    const req = makeRequest('POST', validToken, {
      origin: 'https://malicious-attacker.com',
    });
    const result = requireSession(req, secret);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it('accepts mutating request when origin matches request host (S10)', () => {
    const validToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      4 * 3600 * 1000
    );
    const req = makeRequest('POST', validToken, {
      origin: 'http://localhost:3000',
    });
    const result = requireSession(req, secret);
    expect(result).not.toBeInstanceOf(NextResponse);
  });

  it('provides refreshedToken when less than 2 hours remain (sliding refresh S11)', () => {
    const soonExpiringToken = createSessionToken(
      { userId: 'admin-1', email: 'admin@tikbot.local', role: 'OPERATOR' },
      secret,
      1 * 3600 * 1000 // 1 hour left (< 2 hours)
    );
    const req = makeRequest('GET', soonExpiringToken);
    const result = requireSession(req, secret);
    expect(result).not.toBeInstanceOf(NextResponse);
    const { refreshedToken } = result as { refreshedToken?: string };
    expect(refreshedToken).toBeDefined();
    expect(typeof refreshedToken).toBe('string');
  });
});
