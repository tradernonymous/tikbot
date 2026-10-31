import { describe, it, expect } from 'vitest';
import { SecretRotator } from '../secret-rotation';
import { encryptSecret, decryptSecret } from '../crypto';

describe('SecretRotator', () => {
  const oldKey = 'old_secret_key_01234567890123456'; // 32 chars
  const newKey = 'new_secret_key_98765432109876543'; // 32 chars

  it('re-encrypts a single ciphertext with zero plain-text leaks', () => {
    const originalSecret = 'tiktok_session_cookie_12345';
    const ciphertextOld = encryptSecret(originalSecret, oldKey);

    const rotator = new SecretRotator({ oldKey, newKey });
    const ciphertextNew = rotator.rotateCiphertext(ciphertextOld);

    expect(ciphertextNew).not.toBe(ciphertextOld);

    // Old key can no longer decrypt new ciphertext
    expect(() => decryptSecret(ciphertextNew, oldKey)).toThrow();

    // New key decrypts successfully back to original plain text
    const decryptedWithNew = decryptSecret(ciphertextNew, newKey);
    expect(decryptedWithNew).toBe(originalSecret);
  });

  it('batch rotates a collection of secrets and returns execution report', () => {
    const rotator = new SecretRotator({ oldKey, newKey });

    const secrets = [
      { id: 'sec-1', cipher: encryptSecret('token-1', oldKey) },
      { id: 'sec-2', cipher: encryptSecret('token-2', oldKey) },
      { id: 'sec-3', cipher: 'corrupted-ciphertext-invalid' },
    ];

    const result = rotator.rotateBatch(secrets);

    expect(result.total).toBe(3);
    expect(result.rotated).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.records[0].success).toBe(true);
    expect(result.records[2].success).toBe(false);
  });
});
