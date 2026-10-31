import crypto from 'node:crypto';

export interface OperatorSession {
  userId: string;
  email: string;
  role: 'OPERATOR' | 'AUDITOR';
  exp?: number;
}

const SCRYPT_PREFIX = '$scrypt$';
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * Hashes a plaintext password using scrypt with random salt.
 * Format: "$scrypt$salt_hex$derivedKey_hex"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derivedKey = crypto.scryptSync(password, salt, KEY_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
  });

  return `${SCRYPT_PREFIX}${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash.startsWith(SCRYPT_PREFIX)) {
    return false;
  }

  const parts = storedHash.slice(SCRYPT_PREFIX.length).split('$');
  if (parts.length !== 2) {
    return false;
  }

  const [saltHex, expectedKeyHex] = parts;
  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(expectedKeyHex, 'hex');

    const derivedKey = crypto.scryptSync(password, salt, expectedKey.length, {
      N: 16384,
      r: 8,
      p: 1,
    });

    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

/**
 * Creates a signed JWT-like token (HMAC-SHA256) for session management.
 * Header.Payload.Signature (all base64url encoded)
 */
export function createSessionToken(
  payload: OperatorSession,
  secret: string,
  expiresInMs = 8 * 60 * 60 * 1000 // 8 hours default
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor((Date.now() + expiresInMs) / 1000);
  const fullPayload: OperatorSession = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Verifies and decodes a signed session token. Returns null if invalid or expired.
 */
export function verifySessionToken(token: string, secret: string): OperatorSession | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as OperatorSession;

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
