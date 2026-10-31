import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Signed out' });
  // Clear both the production (__Host-) and development session cookies.
  response.cookies.set('__Host-tikbot_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  response.cookies.delete('tikbot_session');
  return response;
}
