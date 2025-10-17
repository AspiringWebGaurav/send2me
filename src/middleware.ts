import { NextRequest, NextResponse } from "next/server";

const VERIFIED_COOKIE_NAME = "verified";

// Public paths that never require verification
const PUBLIC_PATHS = new Set<string>([
  "/verify",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

// Any request to a file like *.png, *.js, *.css, etc.
const STATIC_FILE_PATTERN = /\.[^/]+$/;

function shouldBypass(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  // Exact public paths
  if (PUBLIC_PATHS.has(pathname)) return true;

  // Next.js internals
  if (pathname.startsWith("/_next")) return true;

  // Allow only the verification APIs to bypass; other APIs still require verification
  if (
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/turnstile")
  ) {
    return true;
  }
  if (pathname.startsWith("/api")) {
    // Other API routes must be verified
    return false;
  }

  // Static assets bypass
  if (STATIC_FILE_PATTERN.test(pathname)) return true;

  return false;
}

// Basic guard against open redirects; allow path + query, disallow /verify
function isValidReturnTo(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("//")) return false; // blocks protocol-relative and dup slashes
  if (path.toLowerCase().startsWith("/verify")) return false;

  try {
    const u = new URL(path, "http://local.test");
    // Preserve querystring
    const normalized = `${u.pathname}${u.search}`;
    return normalized === path;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (shouldBypass(request)) return NextResponse.next();

  // Already verified? Proceed.
  const verified = request.cookies.get(VERIFIED_COOKIE_NAME)?.value === "1";
  if (verified) return NextResponse.next();

  // Not verified → send to /verify with the original path preserved
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const url = new URL("/verify", request.url);

  if (
    requestedPath &&
    requestedPath !== "/verify" &&
    isValidReturnTo(requestedPath)
  ) {
    // Set BOTH keys for backwards compatibility with any older client code
    url.searchParams.set("returnTo", requestedPath);
    url.searchParams.set("redirectTo", requestedPath);
  }

  // IMPORTANT: use redirect (not rewrite) so the verify page can read the query params
  return NextResponse.redirect(url);
}

// Apply to everything except explicitly allowed assets and paths above
export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|api/verify|api/turnstile|verify|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest).*)",
  ],
};