const isDev = process.env.NODE_ENV !== "production";

/**
 * FaceGrem security headers
 *
 * This version is designed to be strong but still login-safe.
 * It does NOT use proxy/middleware redirects.
 * It does NOT use blocking CSP yet; CSP is report-only so it will not break login.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",

  // Kept permissive enough for Next.js, Supabase auth, Google Translate, and development.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com https://translate.googleapis.com https://www.gstatic.com",

  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://translate.googleapis.com",
  "img-src 'self' data: blob: https: *.supabase.co ui-avatars.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: *.supabase.co",
  "media-src 'self' blob: data: https: *.supabase.co",
  "frame-src 'self' https://translate.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  // Layer 1: safe basic browser protections
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // Layer 2: frame and browser-permission protection
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(self), camera=(self), microphone=(self), geolocation=(), gyroscope=(), magnetometer=(), payment=(), usb=()",
  },

  // Layer 3: HTTPS hardening
  // Safe for production HTTPS. If testing only on localhost, browsers normally ignore HSTS for localhost.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },

  // Layer 4: cross-origin protection
  // same-origin-allow-popups is safer for auth popups than strict same-origin.
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },

  // Layer 5: CSP monitoring only.
  // This does NOT block scripts yet, so login should continue working.
  // After we see no browser console violations, we can change this to Content-Security-Policy.
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
];

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // Fixes the warning where Next.js chooses /home/cybersecurity as workspace root.
  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
