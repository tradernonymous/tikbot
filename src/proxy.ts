import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/security/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt static assets, favicon, health check, login API, and machine-to-machine webhooks
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/health/') ||
    pathname === '/api/v1/auth/login' ||
    pathname.startsWith('/api/v1/webhooks/')
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('__Host-tikbot_session')?.value ||
    request.cookies.get('tikbot_session')?.value;

  const secret = process.env.SESSION_SECRET || 'ephemeral-session-secret-for-login-min-32-chars';
  const session = token ? verifySessionToken(token, secret) : null;

  // If visiting /login while already having a valid session, redirect to /dashboard
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Next.js 16 conventions support both proxy and middleware aliases
export const middleware = proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
