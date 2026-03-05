import type { NextConfig } from "next";

/**
 * Content-Security-Policy directives.
 *
 * 'unsafe-inline' for scripts is required because Next.js injects inline
 * scripts (JSON-LD, theme init) and we don't have middleware-based nonces.
 * Still a net win: blocks eval(), external script injection, etc.
 */
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://maps.googleapis.com https://routes.googleapis.com https://places.googleapis.com https://*.google.com",
  "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://*.ggpht.com https://*.googleapis.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
];

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
