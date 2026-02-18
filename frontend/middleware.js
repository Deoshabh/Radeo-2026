import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Next.js Middleware — Server-side route protection
 * Prevents unauthorized access to /admin/* routes before page renders.
 * Fully verifies JWT signature — never falls back to unverified decode.
 * If JWT_SECRET is missing, all admin access is blocked (fail-closed).
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (pathname.startsWith("/admin")) {
    const accessToken = request.cookies.get("accessToken")?.value;

    if (!accessToken) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fail closed — if JWT_SECRET is not configured, block all admin access
    if (!process.env.JWT_SECRET) {
      console.error(
        "CRITICAL: JWT_SECRET not set — blocking all admin access",
      );
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(accessToken, secret);

      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // Token invalid, expired, or tampered — always redirect
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
