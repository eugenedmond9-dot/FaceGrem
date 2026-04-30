import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/feed",
  "/messages",
  "/profile",
  "/settings",
  "/saved",
  "/groups",
  "/communities",
  "/friends",
  "/videos",
  "/notifications",
];

const blockedPathPatterns = [
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/phpmyadmin/i,
  /\/\.env/i,
  /\/\.git/i,
  /\/server-status/i,
];

const suspiciousQueryPatterns = [
  /<script/i,
  /javascript:/i,
  /union\s+select/i,
  /select\s+.+\s+from/i,
  /\.\.\//i,
  /etc\/passwd/i,
];

function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some((cookie: { name: string }) => {
    return cookie.name.startsWith("sb-") || cookie.name === "supabase-auth-token";
  });
}

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isSuspiciousRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (blockedPathPatterns.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  if (suspiciousQueryPatterns.some((pattern) => pattern.test(search))) {
    return true;
  }

  const userAgent = request.headers.get("user-agent") || "";

  if (!userAgent || userAgent.length > 512) {
    return true;
  }

  return false;
}

export function proxy(request: NextRequest) {
  if (isSuspiciousRequest(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const response = NextResponse.next();

  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  if (!isProtectedRoute(request.nextUrl.pathname)) {
    return response;
  }

  if (!hasSupabaseSession(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|facegrem-logo-mark.png|facegrem-logo-full.png).*)",
  ],
};
