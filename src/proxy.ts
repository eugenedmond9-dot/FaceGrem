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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Do not interfere with the home/login/signup pages, Next.js assets, images, or API routes.
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  if (!hasSupabaseSession(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/saved/:path*",
    "/groups/:path*",
    "/communities/:path*",
    "/friends/:path*",
    "/videos/:path*",
    "/notifications/:path*",
  ],
};
