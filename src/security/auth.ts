import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

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

export interface RequireSessionResult {
  session: OperatorSession;
  refreshedToken?: string;
}

/**
 * Shared authentication & authorization guard for API route handlers (S4, S10, S11).
 * Validates session token signature and expiration, executes CSRF check on mutations,
 * and issues sliding refresh token when remaining validity is under 2 hours.
 */
export function requireSession(
  request: NextRequest,
  explicitSecret?: string
): RequireSessionResult | NextResponse {
  // CSRF / Origin check on mutating requests (S10)
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const reqOrigin = new URL(request.url).origin;
        if (origin !== reqOrigin) {
          return NextResponse.json(
            { error: 'CSRF validation failed: Origin mismatch' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'CSRF validation failed: Invalid request URL' },
          { status: 403 }
        );
      }
    }
  }

  // Extract session token from cookie or Authorization header
  const token =
    request.cookies.get('__Host-tikbot_session')?.value ||
    request.cookies.get('tikbot_session')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const secret = explicitSecret || process.env.SESSION_SECRET || 'ephemeral-session-secret-for-login-min-32-chars';
  const payload = verifySessionToken(token, secret);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
  }

  // Sliding refresh when less than 2 hours remain (S11)
  let refreshedToken: string | undefined;
  if (payload.exp) {
    const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000);
    if (remainingSeconds < 2 * 3600) {
      refreshedToken = createSessionToken(
        { userId: payload.userId, email: payload.email, role: payload.role },
        secret,
        8 * 3600 * 1000
      );
    }
  }

  return { session: payload, refreshedToken };
}
