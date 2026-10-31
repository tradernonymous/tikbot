import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken } from '@/security/auth';
import { getConfig } from '@/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const config = getConfig();

    let isValid = false;
    const targetPassword = process.env.ADMIN_PASSWORD || process.env.DASHBOARD_PASSWORD || 'admin';
    if (password === targetPassword) {
      isValid = true;
    } else if (config.ADMIN_PASSWORD && password === config.ADMIN_PASSWORD) {
      isValid = true;
    } else {
      // Scrypt hash verification fallback
      isValid = verifyPassword(password, config.OPERATOR_PASSWORD_HASH);
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid master credentials' }, { status: 401 });
    }

    const sessionToken = createSessionToken(
      {
        userId: 'admin-operator',
        email: 'admin@tikbot.local',
        role: 'OPERATOR',
      },
      config.SESSION_SECRET,
      8 * 60 * 60 * 1000 // 8 hours
    );

    const response = NextResponse.json({
      success: true,
      user: {
        userId: 'admin-operator',
        email: 'admin@tikbot.local',
        role: 'OPERATOR',
      },
    });

    response.cookies.set({
      name: 'tikbot_session',
      value: sessionToken,
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication failure' },
      { status: 500 }
    );
  }
}
