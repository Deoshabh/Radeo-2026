import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side middleware for admin route protection.
 * Checks for the presence of an access token and validates the role claim.
 * Full auth verification still happens on the backend — this is a fast first gate.
 *
 * Also blocks non-GET/HEAD requests to page routes to prevent
 * "Failed to parse body as FormData" errors from bots sending POST to pages.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Block POST/PUT/PATCH/DELETE to page routes (not API, not _next, not static assets)
  // Next.js 14 tries to parse these as Server Action FormData and crashes
  if (
    method !== 'GET' &&
    method !== 'HEAD' &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.includes('.')
  ) {
    return new NextResponse(null, { status: 405, statusText: 'Method Not Allowed' });
  }

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode JWT payload (base64) to check role — no crypto verification here
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role
    const adminRoles = ['admin', 'designer', 'publisher'];
    if (!payload.role || !adminRoles.includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    // If token is malformed, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
};
