import type { NextConfig } from "next";

/**
 * Security headers — ExamMind
 * Applied to all routes. CSP is strict; no inline scripts beyond what Next.js
 * requires for hydration (nonces not needed for this app — no user-generated HTML).
 */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // CSP: allow self + data URIs for images (recharts SVG), block everything else by default.
    // NOTE: 'unsafe-inline' for styles is required by Tailwind CSS v4 (inline style injection).
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js hydration requires these
      "style-src 'self' 'unsafe-inline'",                // Tailwind CSS v4 inline styles
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",                              // API calls are same-origin only
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
