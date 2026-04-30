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

function getCookieHeader(request: Request) {
  return request.headers.get("cookie") || "";
}

function hasSupabaseSession(request: Request) {
  const cookieHeader = getCookieHeader(request);

  return (
    cookieHeader.includes("sb-") ||
    cookieHeader.includes("supabase-auth-token")
  );
}

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isSuspiciousRequest(request: Request) {
  const url = new URL(request.url);
  const { pathname, search } = url;

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

export function middleware(request: Request) {
  const url = new URL(request.url);

  if (isSuspiciousRequest(request)) {
    return new Response("Forbidden", {
      status: 403,
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!isProtectedRoute(url.pathname)) {
    return new Response(null, {
      status: 200,
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!hasSupabaseSession(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", url.pathname);

    return Response.redirect(loginUrl, 307);
  }

  return new Response(null, {
    status: 200,
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|facegrem-logo-mark.png|facegrem-logo-full.png).*)",
  ],
};
