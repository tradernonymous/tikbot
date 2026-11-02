import { type NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/security/session-revocation';

export const dynamic = 'force-dynamic';

export async function POST(request?: NextRequest) {
  const token =
    request?.cookies?.get?.('__Host-tikbot_session')?.value ||
    request?.cookies?.get?.('tikbot_session')?.value ||
    request?.headers?.get?.('authorization')?.replace(/^Bearer\s+/i, '');

  if (token) {
    await revokeToken(token);
  }

  const response = NextResponse.json({ success: true, message: 'Signed out' });
  // Clear both the production (__Host-) and development session cookies.
  response.cookies.set('__Host-tikbot_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.delete('tikbot_session');
  return response;
}
