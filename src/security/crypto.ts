import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function parseKey(key: string | Buffer): Buffer {
  if (Buffer.isBuffer(key)) {
    if (key.length !== 32) {
      throw new Error(`Master key must be exactly 32 bytes (got ${key.length} bytes)`);
    }
    return key;
  }

  const hexRegex = /^[0-9a-fA-F]{64}$/;
  if (hexRegex.test(key)) {
    return Buffer.from(key, 'hex');
  }

  const utf8Buffer = Buffer.from(key, 'utf8');
  if (utf8Buffer.length === 32) {
    return utf8Buffer;
  }

  throw new Error(`Master key must be exactly 32 bytes (got ${utf8Buffer.length} bytes)`);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: "iv_hex:authTag_hex:ciphertext_hex"
 */
export function encryptSecret(plainText: string, masterKey: string | Buffer): string {
  const key = parseKey(masterKey);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted envelope string formatted as "iv_hex:authTag_hex:ciphertext_hex".
 */
export function decryptSecret(envelope: string, masterKey: string | Buffer): string {
  const parts = envelope.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret envelope format (expected iv:authTag:ciphertext)');
  }

  const [ivHex, authTagHex, cipherTextHex] = parts;
  const key = parseKey(masterKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypts arbitrary serializable objects (e.g. cookies, credentials).
 */
export function encryptJson<T>(data: T, masterKey: string | Buffer): string {
  return encryptSecret(JSON.stringify(data), masterKey);
}

/**
 * Decrypts encrypted envelope back into structured object.
 */
export function decryptJson<T>(envelope: string, masterKey: string | Buffer): T {
  const raw = decryptSecret(envelope, masterKey);
  return JSON.parse(raw) as T;
}
