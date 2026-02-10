import { NextResponse } from "next/server";

/**
 * Next.js Middleware - Server-side route protection
 * Prevents unauthorized access to /admin/* routes before page renders.
 * This stops the "flash of admin UI" for non-authenticated users.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (pathname.startsWith("/admin")) {
    // Check for auth token in cookies
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      // No token — redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists — allow through (role check happens client-side since
    // JWT verification requires the secret which isn't available in Edge Runtime)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
