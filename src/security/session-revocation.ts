import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

// In-memory revocation cache with expiration timestamps
const revokedTokensMap = new Map<string, number>();

/**
 * Computes a constant-length SHA-256 hash of a session token for secure indexing.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Revokes a session token.
 * Writes to in-memory store and attempts durable persistence.
 */
export async function revokeToken(token: string, expiresInMs = 8 * 3600 * 1000): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + expiresInMs;
  revokedTokensMap.set(tokenHash, expiresAt);

  try {
    // Durable persistence via SystemSetting table (key: `revoked_token:${tokenHash}`)
    if (process.env.DATABASE_URL && prisma && prisma.systemSetting) {
      await prisma.systemSetting.upsert({
        where: { key: `revoked_token:${tokenHash}` },
        update: { value: JSON.stringify({ expiresAt }) },
        create: {
          key: `revoked_token:${tokenHash}`,
          value: JSON.stringify({ expiresAt }),
        },
      });
    }
  } catch {
    // Fall back to memory cache if database is temporarily unavailable
  }
}

/**
 * Synchronous check against in-memory revocation cache.
 */
export function isTokenRevokedSync(token: string): boolean {
  if (!token) return true;
  const tokenHash = hashToken(token);
  const expiresAt = revokedTokensMap.get(tokenHash);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    revokedTokensMap.delete(tokenHash);
    return false;
  }
  return true;
}

/**
 * Checks whether a token has been revoked, querying local cache and database.
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  const tokenHash = hashToken(token);

  if (isTokenRevokedSync(token)) {
    return true;
  }

  try {
    if (process.env.DATABASE_URL && prisma && prisma.systemSetting) {
      const record = await prisma.systemSetting.findUnique({
        where: { key: `revoked_token:${tokenHash}` },
      });
      if (record) {
        const data = JSON.parse(record.value);
        if (data.expiresAt && Date.now() <= data.expiresAt) {
          revokedTokensMap.set(tokenHash, data.expiresAt);
          return true;
        }
      }
    }
  } catch {
    // Rely on in-memory store
  }

  return false;
}

/**
 * Clears the revocation registry (primarily for test teardown).
 */
export function clearRevocations(): void {
  revokedTokensMap.clear();
}
