import { describe, it, expect } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  encryptJson,
  decryptJson,
} from '../crypto';

describe('Cryptographic Secret Storage (AES-256-GCM)', () => {
  const masterKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const alternateKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

  it('encrypts and decrypts a plain text secret correctly', () => {
    const secret = 'my-super-secret-session-token-or-password';
    const encrypted = encryptSecret(secret, masterKey);

    expect(encrypted).not.toBe(secret);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i); // iv:tag:ciphertext

    const decrypted = decryptSecret(encrypted, masterKey);
    expect(decrypted).toBe(secret);
  });

  it('fails decryption if encrypted payload is tampered with', () => {
    const secret = 'proxy-password-xyz';
    const encrypted = encryptSecret(secret, masterKey);
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    const tamperedCiphertext = parts[2].substring(0, parts[2].length - 2) + (parts[2].endsWith('a') ? 'b' : 'a');
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;

    expect(() => decryptSecret(tamperedPayload, masterKey)).toThrow();
  });

  it('fails decryption if wrong key is provided', () => {
    const secret = 'session-cookie-data';
    const encrypted = encryptSecret(secret, masterKey);

    expect(() => decryptSecret(encrypted, alternateKey)).toThrow();
  });

  it('fails encryption when key length is invalid', () => {
    expect(() => encryptSecret('test', 'short-key')).toThrowError(/32 bytes/);
  });

  it('fails decryption with invalid envelope format', () => {
    expect(() => decryptSecret('invalid-envelope-format', masterKey)).toThrowError(/envelope/);
  });

  it('encrypts and decrypts structured JSON objects correctly', () => {
    const cookieJar = [
      { name: 'sessionid', value: '123456789abcdef', domain: '.tiktok.com' },
      { name: 'tt_csrf_token', value: 'secret_csrf', domain: '.tiktok.com' },
    ];

    const encrypted = encryptJson(cookieJar, masterKey);
    const decrypted = decryptJson<typeof cookieJar>(encrypted, masterKey);

    expect(decrypted).toEqual(cookieJar);
  });

  it('encrypts and decrypts with Buffer master key', () => {
    const bufferKey = Buffer.from(masterKey, 'hex');
    const secret = 'buffer-key-secret';
    const encrypted = encryptSecret(secret, bufferKey);
    const decrypted = decryptSecret(encrypted, bufferKey);
    expect(decrypted).toBe(secret);
  });

  it('fails with invalid Buffer master key length', () => {
    const invalidBuffer = Buffer.from('short');
    expect(() => encryptSecret('test', invalidBuffer)).toThrowError(/32 bytes/);
  });

  it('encrypts and decrypts with 32-character utf8 key', () => {
    const utf8Key = '12345678901234567890123456789012'; // exactly 32 chars
    const secret = 'utf8-secret';
    const encrypted = encryptSecret(secret, utf8Key);
    const decrypted = decryptSecret(encrypted, utf8Key);
    expect(decrypted).toBe(secret);
  });
});
