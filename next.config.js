/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  async headers() {
    // ✅ Clean, single CSP directive (no duplicates)
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://challenges.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://challenges.cloudflare.com",
      "frame-src 'self' https://accounts.google.com https://send2me-f4f3b.firebaseapp.com https://challenges.cloudflare.com",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");

    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: csp,
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "unsafe-none",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;