import { describe, it, expect } from 'vitest';
import {
  packAndEncryptSession,
  decryptAndUnpackSession,
  isSessionExpired,
  type AccountSessionPackage,
} from '../session-vault';

describe('Account Session Vault & Encrypted Import/Export', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  it('encrypts session cookies & storage tokens and decrypts them accurately', () => {
    const session: AccountSessionPackage = {
      accountId: 'acc-farm-1',
      platform: 'TIKTOK',
      cookies: [
        { name: 'sessionid', value: 'secret_tiktok_session_hash', domain: '.tiktok.com' },
        { name: 'tt_csrf_token', value: 'csrf_123', domain: '.tiktok.com' },
      ],
      localStorage: {
        'odin_tt': 'device_token_abc',
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      capturedAt: new Date().toISOString(),
    };

    const encrypted = packAndEncryptSession(session, masterKey);
    expect(encrypted).not.toContain('secret_tiktok_session_hash');

    const decrypted = decryptAndUnpackSession(encrypted, masterKey);
    expect(decrypted.accountId).toBe('acc-farm-1');
    expect(decrypted.cookies).toHaveLength(2);
    expect(decrypted.localStorage['odin_tt']).toBe('device_token_abc');
  });

  it('detects expired session cookies', () => {
    const expiredCookies = [
      { name: 'sessionid', value: 'val', domain: '.tiktok.com', expires: Date.now() / 1000 - 3600 },
    ];
    expect(isSessionExpired(expiredCookies)).toBe(true);

    const validCookies = [
      { name: 'sessionid', value: 'val', domain: '.tiktok.com', expires: Date.now() / 1000 + 3600 },
    ];
    expect(isSessionExpired(validCookies)).toBe(false);
  });
});
