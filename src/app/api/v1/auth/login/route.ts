import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { verifyPassword, createSessionToken, getSessionSecret, attachSessionCookie } from '@/security/auth';
import { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } from '@/security/login-rate-limiter';
import { getConfig } from '@/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate Limiting check (S9)
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || 'Too many login attempts' },
        { status: rateCheck.status || 429 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const { password } = body || {};

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    let config: any;
    try {
      config = getConfig();
    } catch (configErr: any) {
      const msg = configErr?.message || '';
      console.error('[CONFIG ERROR] Server configuration error:', msg);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || config.ADMIN_PASSWORD;
    const operatorHash = process.env.OPERATOR_PASSWORD_HASH || config.OPERATOR_PASSWORD_HASH;

    // Check if operator credentials are configured
    const hasConfiguredCredentials = Boolean(
      (adminPassword && adminPassword.trim().length > 0) ||
      (operatorHash && operatorHash !== '$scrypt$16b_salt$default_dev_hash' && operatorHash.trim().length > 0)
    );

    if (!hasConfiguredCredentials) {
      return NextResponse.json(
        { error: 'operator credentials not configured' },
        { status: 503 }
      );
    }

    let isValid = false;

    if (adminPassword) {
      const inputBuf = Buffer.from(password);
      const expectedBuf = Buffer.from(adminPassword);
      if (inputBuf.length === expectedBuf.length) {
        isValid = crypto.timingSafeEqual(inputBuf, expectedBuf);
      } else {
        crypto.timingSafeEqual(inputBuf, inputBuf);
        isValid = false;
      }
    } else if (operatorHash) {
      isValid = verifyPassword(password, operatorHash);
    }

    if (!isValid) {
      recordLoginFailure(ip);
      return NextResponse.json({ error: 'Invalid master credentials' }, { status: 401 });
    }

    recordLoginSuccess(ip);

    const sessionSecret = getSessionSecret();
    const sessionToken = createSessionToken(
      {
        userId: 'admin-operator',
        email: 'admin@tikbot.local',
        role: 'OPERATOR',
      },
      sessionSecret,
      8 * 60 * 60 * 1000 // 8 hours
    );

    const proto =
      request.headers.get('x-forwarded-proto') ||
      (request.url.startsWith('https:') ? 'https' : 'http');
    const isHttps = proto === 'https';

    const response = NextResponse.json({
      success: true,
      user: {
        userId: 'admin-operator',
        email: 'admin@tikbot.local',
        role: 'OPERATOR',
      },
    });

    attachSessionCookie(response, sessionToken, isHttps);

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication failure' },
      { status: 500 }
    );
  }
}
