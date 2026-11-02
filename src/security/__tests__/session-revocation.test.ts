import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashToken,
  revokeToken,
  isTokenRevoked,
  isTokenRevokedSync,
  clearRevocations,
} from '../session-revocation';
import { prisma } from '@/lib/prisma';

describe('Session Revocation Module (0.2 & 0.11)', () => {
  beforeEach(() => {
    clearRevocations();
    vi.restoreAllMocks();
  });

  it('handles empty or null tokens safely', async () => {
    await revokeToken('');
    expect(isTokenRevokedSync('')).toBe(true);
    expect(await isTokenRevoked('')).toBe(true);
  });

  it('computes stable SHA-256 hashes', () => {
    const h1 = hashToken('test-token-123');
    const h2 = hashToken('test-token-123');
    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
  });

  it('revokes and checks token in-memory', async () => {
    const token = 'active-jwt-token-sample';
    expect(isTokenRevokedSync(token)).toBe(false);
    expect(await isTokenRevoked(token)).toBe(false);

    await revokeToken(token, 10000);
    expect(isTokenRevokedSync(token)).toBe(true);
    expect(await isTokenRevoked(token)).toBe(true);
  });

  it('expires revoked tokens after TTL has passed', async () => {
    const token = 'short-lived-token';
    // Revoke with negative ms so it is already in the past
    await revokeToken(token, -1000);
    expect(isTokenRevokedSync(token)).toBe(false);
    expect(await isTokenRevoked(token)).toBe(false);
  });

  it('persists revocation to Prisma when DATABASE_URL is present', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
    const upsertSpy = vi.spyOn(prisma.systemSetting, 'upsert').mockResolvedValue({} as any);

    await revokeToken('persisted-token', 5000);
    expect(upsertSpy).toHaveBeenCalled();
  });

  it('retrieves revocation from Prisma on cold in-memory cache', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
    const token = 'cold-cache-token';
    const tokenHash = hashToken(token);

    vi.spyOn(prisma.systemSetting, 'findUnique').mockResolvedValue({
      key: `revoked_token:${tokenHash}`,
      value: JSON.stringify({ expiresAt: Date.now() + 10000 }),
      updatedAt: new Date(),
    });

    // In-memory cache is empty
    clearRevocations();
    expect(isTokenRevokedSync(token)).toBe(false);

    // Async query pulls from database and populates cache
    const revoked = await isTokenRevoked(token);
    expect(revoked).toBe(true);
    expect(isTokenRevokedSync(token)).toBe(true);
  });

  it('handles database errors gracefully without throwing', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
    vi.spyOn(prisma.systemSetting, 'findUnique').mockRejectedValue(new Error('DB failure'));
    vi.spyOn(prisma.systemSetting, 'upsert').mockRejectedValue(new Error('DB failure'));

    await expect(revokeToken('failing-db-token')).resolves.not.toThrow();
    await expect(isTokenRevoked('failing-db-token')).resolves.toBe(true);
  });
});
