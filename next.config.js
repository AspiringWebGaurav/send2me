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
    const allowVercelLive =
      process.env.ENABLE_VERCEL_LIVE === "true" || process.env.VERCEL_ENV === "preview";

    const directives = {
      "default-src": new Set(["'self'"]),
      "script-src": new Set([
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://www.googletagmanager.com",
        "https://apis.google.com",
        "https://challenges.cloudflare.com",
      ]),
      "style-src": new Set(["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]),
      "img-src": new Set([
        "'self'",
        "data:",
        "blob:",
        "https://images.unsplash.com",
        "https://lh3.googleusercontent.com",
        "https://challenges.cloudflare.com",
      ]),
      "font-src": new Set(["'self'", "https://fonts.gstatic.com"]),
      "connect-src": new Set([
        "'self'",
        "https://*.firebaseio.com",
        "https://firestore.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://challenges.cloudflare.com",
      ]),
      "frame-src": new Set([
        "'self'",
        "https://accounts.google.com",
        "https://send2me-f4f3b.firebaseapp.com",
        "https://challenges.cloudflare.com",
      ]),
      "form-action": new Set(["'self'"]),
      "base-uri": new Set(["'self'"]),
      "object-src": new Set(["'none'"]),
    };

    if (allowVercelLive) {
      directives["script-src"].add("https://vercel.live");
      directives["connect-src"].add("https://vercel.live");
    }

    directives["script-src-elem"] = new Set(directives["script-src"]);
    directives["script-src-attr"] = new Set(["'none'"]);

    const csp = Object.entries(directives)
      .map(([key, value]) => `${key} ${Array.from(value).join(" ")}`)
      .join("; ");

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
