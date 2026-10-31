import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from '../auth';

describe('Single-Operator Auth & Session Security', () => {
  const sessionSecret = 'super-secret-session-key-minimum-32-chars-long';

  it('hashes a password and verifies it correctly', () => {
    const password = 'CorrectHorseBatteryStaple!42';
    const hash = hashPassword(password);

    expect(hash).toContain('$scrypt$');
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('generates unique hashes for identical passwords due to salt', () => {
    const password = 'SecurePassword123';
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword(password, hash1)).toBe(true);
    expect(verifyPassword(password, hash2)).toBe(true);
  });

  it('fails verification on invalid hash format', () => {
    expect(verifyPassword('password', 'invalid-hash')).toBe(false);
  });

  it('creates and verifies a tamper-proof session token', () => {
    const session = {
      userId: 'operator-1',
      email: 'admin@tikbot.local',
      role: 'OPERATOR' as const,
    };

    const token = createSessionToken(session, sessionSecret, 3600 * 1000);
    expect(token).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);

    const verified = verifySessionToken(token, sessionSecret);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('operator-1');
    expect(verified?.email).toBe('admin@tikbot.local');
    expect(verified?.role).toBe('OPERATOR');
  });

  it('rejects tampered session tokens', () => {
    const session = { userId: 'operator-1', email: 'admin@tikbot.local', role: 'OPERATOR' as const };
    const token = createSessionToken(session, sessionSecret, 3600 * 1000);
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'hacker', role: 'OPERATOR' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    expect(verifySessionToken(tamperedToken, sessionSecret)).toBeNull();
  });

  it('rejects expired session tokens', () => {
    const session = { userId: 'operator-1', email: 'admin@tikbot.local', role: 'OPERATOR' as const };
    // expired 10 seconds ago
    const expiredToken = createSessionToken(session, sessionSecret, -10000);

    expect(verifySessionToken(expiredToken, sessionSecret)).toBeNull();
  });

  it('rejects tokens signed with different secret', () => {
    const session = { userId: 'operator-1', email: 'admin@tikbot.local', role: 'OPERATOR' as const };
    const token = createSessionToken(session, sessionSecret, 3600 * 1000);

    expect(verifySessionToken(token, 'different-secret-key-that-does-not-match')).toBeNull();
  });

  it('rejects malformed token strings', () => {
    expect(verifySessionToken('not-a-valid-token', sessionSecret)).toBeNull();
  });
});
