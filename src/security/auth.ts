import crypto from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { isTokenRevokedSync } from './session-revocation';

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
 * Returns the active session secret from environment variables.
 * Fails startup fast when missing or shorter than 32 characters.
 * Never writes fallback values into process.env.
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET environment variable is missing or shorter than 32 characters');
  }
  return secret;
}

/**
 * Detects whether the request was served over HTTPS directly or via a trusted reverse proxy.
 */
export function detectIsHttps(request: Request | NextRequest): boolean {
  const forwardedProto = request.headers?.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }
  try {
    const url = new URL(request.url);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns cookie configuration matching the connection transport (HTTPS vs HTTP)
 * preventing browser rejection of __Host- cookies on local or unencrypted setups.
 */
export function getSessionCookieOptions(isHttps = false): {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict';
  path: string;
  maxAge: number;
} {
  const isProd = process.env.NODE_ENV === 'production';
  const useHostPrefix = isProd && isHttps;
  return {
    name: useHostPrefix ? '__Host-tikbot_session' : 'tikbot_session',
    secure: useHostPrefix,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 3600,
  };
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
  let token: string | undefined;
  if (request.cookies && typeof request.cookies.get === 'function') {
    token =
      request.cookies.get('__Host-tikbot_session')?.value ||
      request.cookies.get('tikbot_session')?.value;
  }
  if (!token) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)(?:__Host-)?tikbot_session=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }
  if (!token) {
    token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  }

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const secret = explicitSecret || getSessionSecret();
  const payload = verifySessionToken(token, secret);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
  }

  if (isTokenRevokedSync(token)) {
    return NextResponse.json({ error: 'Session has been revoked' }, { status: 401 });
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

/**
 * Attaches the hardened session cookie to a NextResponse (S11).
 */
export function attachSessionCookie(response: NextResponse, token: string, isHttps = false): void {
  const opts = getSessionCookieOptions(isHttps);
  response.cookies.set({
    name: opts.name,
    value: token,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
}

/**
 * If the session was refreshed via sliding window, attaches the new cookie to the response.
 */
export function handleSessionRefresh(
  auth: RequireSessionResult,
  response: NextResponse,
  isHttps = false
): NextResponse {
  if (auth.refreshedToken) {
    attachSessionCookie(response, auth.refreshedToken, isHttps);
  }
  return response;
}


/** Cookie names accepted for the operator session (production uses the __Host- prefix). */
export const SESSION_COOKIE_NAMES = ['__Host-tikbot_session', 'tikbot_session'] as const;

/**
 * Resolves the session token from a cookie reader, accepting both the
 * production (__Host-) and development cookie names.
 */
export function readSessionTokenFromCookies(
  get: (name: string) => { value: string } | undefined
): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = get(name)?.value;
    if (value) return value;
  }
  return undefined;
}
