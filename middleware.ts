import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow auth callbacks and webhook routes
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/setup') || pathname.startsWith('/api/test_cred')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  const refreshToken = req.cookies.get('corsair_refresh_token');

  if (!refreshToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // We fetch the current user status from our own API because we cannot run Prisma in Edge middleware
  const response = await fetch(new URL('/api/auth/me', req.url), {
    headers: { cookie: req.headers.get('cookie') || '' },
  });

  if (!response.ok) {
    // If the token is invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const data = await response.json();
  const user = data.user;

  // 1. If user is authenticated but emailVerifiedAt is null → redirect to /verify-email
  if (!user.emailVerifiedAt) {
    if (pathname !== '/verify-email' && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/verify-email', req.url));
    }
    // Allow API requests to go through (they should implement their own deeper checks if needed)
    return NextResponse.next();
  }

  // 2. If user is authenticated + verified but gmailConnected is false → redirect to /onboarding
  if (!user.gmailConnected) {
    if (pathname !== '/onboarding' && pathname !== '/verify-email' && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
    return NextResponse.next();
  }

  // 3. If user is on /onboarding and gmailConnected is true → allow through to /inbox
  if (pathname === '/onboarding' && user.gmailConnected) {
    return NextResponse.redirect(new URL('/inbox', req.url));
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
