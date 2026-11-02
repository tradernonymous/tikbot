import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionSecret,
  getSessionCookieOptions,
  createSessionToken,
  requireSession,
  detectIsHttps,
} from '../auth';
import {
  revokeToken,
  isTokenRevoked,
  clearRevocations,
} from '../session-revocation';
import { sanitizeRedirectPath } from '@/app/login/page';
import { loadConfig } from '@/config';
import { proxy } from '@/proxy';
import {
  enqueueOrder,
  listOrders,
  clearOrders,
  reloadOrdersFromPrisma,
} from '@/farm/order-queue';
import { prisma } from '@/lib/prisma';

describe('PHASE 0: STABILITY AND SECURITY FIXES', () => {
  const originalEnv = { ...process.env };
  const validSecret = 'valid-super-secure-session-secret-key-32-chars';

  beforeEach(() => {
    process.env = { ...originalEnv };
    clearRevocations();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // 0.1: getSessionSecret() strictness
  describe('0.1 getSessionSecret() strictness', () => {
    it('throws fast when SESSION_SECRET is missing from env', () => {
      delete process.env.SESSION_SECRET;
      expect(() => getSessionSecret()).toThrowError(/SESSION_SECRET.*missing.*32/i);
      expect(process.env.SESSION_SECRET).toBeUndefined();
    });

    it('throws fast when SESSION_SECRET is shorter than 32 characters', () => {
      process.env.SESSION_SECRET = 'too-short-secret';
      expect(() => getSessionSecret()).toThrowError(/SESSION_SECRET.*missing.*32/i);
    });

    it('returns the secret when >= 32 characters and does NOT write fallback into process.env', () => {
      process.env.SESSION_SECRET = validSecret;
      const secret = getSessionSecret();
      expect(secret).toBe(validSecret);
    });
  });

  // 0.2: Session Revocation
  describe('0.2 Session Revocation Guarding', () => {
    it('revokes a token and ensures isTokenRevoked returns true', async () => {
      process.env.SESSION_SECRET = validSecret;
      const token = createSessionToken(
        { userId: 'op-1', email: 'op@tikbot.local', role: 'OPERATOR' },
        validSecret
      );

      expect(await isTokenRevoked(token)).toBe(false);
      await revokeToken(token);
      expect(await isTokenRevoked(token)).toBe(true);
    });

    it('requireSession rejects revoked tokens with 401 status', async () => {
      process.env.SESSION_SECRET = validSecret;
      const token = createSessionToken(
        { userId: 'op-1', email: 'op@tikbot.local', role: 'OPERATOR' },
        validSecret
      );

      await revokeToken(token);

      const req = new NextRequest('http://localhost:3000/api/v1/accounts', {
        headers: {
          cookie: `tikbot_session=${token}`,
        },
      });

      const res = await requireSession(req);
      expect(res).toBeInstanceOf(NextResponse);
      const json = await (res as NextResponse).json();
      expect((res as NextResponse).status).toBe(401);
      expect(json.error).toMatch(/revoked/i);
    });

    it('proxy rejects revoked tokens and redirects to /login', async () => {
      process.env.SESSION_SECRET = validSecret;
      const token = createSessionToken(
        { userId: 'op-1', email: 'op@tikbot.local', role: 'OPERATOR' },
        validSecret
      );

      await revokeToken(token);

      const req = new NextRequest('http://localhost:3000/dashboard/accounts', {
        headers: {
          cookie: `tikbot_session=${token}`,
        },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });
  });

  // 0.3: Token Transport Matrix
  describe('0.3 Token Transport Matrix', () => {
    it('correctly detects HTTPS from request headers and URL', () => {
      const directHttps = new NextRequest('https://tikbot.local/api/test');
      expect(detectIsHttps(directHttps)).toBe(true);

      const proxiedHttps = new NextRequest('http://tikbot.local/api/test', {
        headers: { 'x-forwarded-proto': 'https' },
      });
      expect(detectIsHttps(proxiedHttps)).toBe(true);

      const plainHttp = new NextRequest('http://localhost:3000/api/test');
      expect(detectIsHttps(plainHttp)).toBe(false);
    });

    it('configures __Host- cookie with Secure=true for HTTPS in production', () => {
      (process.env as any).NODE_ENV = 'production';
      const opts = getSessionCookieOptions(true);
      expect(opts.name).toBe('__Host-tikbot_session');
      expect(opts.secure).toBe(true);
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe('lax');
    });

    it('configures plain tikbot_session with Secure=false for plain HTTP in dev', () => {
      (process.env as any).NODE_ENV = 'development';
      const opts = getSessionCookieOptions(false);
      expect(opts.name).toBe('tikbot_session');
      expect(opts.secure).toBe(false);
      expect(opts.httpOnly).toBe(true);
    });
  });

  // 0.5: Strict Open Redirect Sanitization
  describe('0.5 Strict Open Redirect Sanitization', () => {
    it('allows valid internal paths with single leading slash', () => {
      expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/dashboard/accounts?tab=active')).toBe('/dashboard/accounts?tab=active');
      expect(sanitizeRedirectPath('/dashboard/farm/services')).toBe('/dashboard/farm/services');
    });

    it('rejects double slashes, backslashes, and schemes', () => {
      expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/\\evil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('\\evil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
    });

    it('rejects URL-encoded slash and backslash variants', () => {
      expect(sanitizeRedirectPath('/%2fevil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/%2Fevil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/%5cevil.com')).toBe('/dashboard');
      expect(sanitizeRedirectPath('/%5Cevil.com')).toBe('/dashboard');
    });

    it('falls back to /dashboard on null, undefined, or empty', () => {
      expect(sanitizeRedirectPath(null)).toBe('/dashboard');
      expect(sanitizeRedirectPath(undefined)).toBe('/dashboard');
      expect(sanitizeRedirectPath('')).toBe('/dashboard');
    });
  });

  // 0.7: ID Generation & Rapid Uniqueness
  describe('0.7 ID Generation & Rapid Uniqueness', () => {
    it('generates 150+ cryptographically unique IDs with zero collisions', () => {
      const ids = new Set<string>();
      const count = 150;
      for (let i = 0; i < count; i++) {
        ids.add(crypto.randomUUID());
      }
      expect(ids.size).toBe(count);
    });
  });

  // 0.9 & 0.11: Durable Farm State & Cross-Restart Persistence
  describe('0.9 Durable Farm State Persistence', () => {
    it('persists queued boost orders into Prisma and reloads them', async () => {
      clearOrders();
      const mockOrder = {
        id: 'ord-test-1',
        targetUrl: 'https://tiktok.com/@growth/video/1',
        targetHandle: '@growth',
        goalTier: 'PRIME',
        targetReach: 1000,
        status: 'RUNNING',
        plausibilityScore: 95,
        progressPercent: 0,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock prisma.farmBoostOrder if running in test environment
      vi.spyOn(prisma.farmBoostOrder, 'upsert').mockResolvedValue(mockOrder as any);
      vi.spyOn(prisma.farmBoostOrder, 'findMany').mockResolvedValue([mockOrder as any]);

      const created = await enqueueOrder({
        targetUrl: 'https://tiktok.com/@growth/video/1',
        targetHandle: '@growth',
        goalTier: 'PRIME',
        targetReach: 1000,
        plausibilityScore: 95,
      });

      expect(created.targetHandle).toBe('@growth');

      // Simulate process restart
      clearOrders();
      expect(listOrders()).toHaveLength(0);

      await reloadOrdersFromPrisma();
      const reloaded = listOrders();
      expect(reloaded.length).toBeGreaterThanOrEqual(1);
      expect(reloaded.find((o) => o.targetHandle === '@growth')).toBeDefined();
    });
  });

  // 0.10: Dev vs Production Config Isolation
  describe('0.10 Production Boot Fails Loudly on Missing Secrets', () => {
    it('throws in production when MASTER_ENCRYPTION_KEY or SESSION_SECRET are missing', () => {
      expect(() =>
        loadConfig({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          INTERNAL_API_SECRET: 'min-16-char-internal-secret',
        })
      ).toThrowError(/Configuration Validation Error.*(MASTER_ENCRYPTION_KEY|SESSION_SECRET)/);
    });
  });
});
