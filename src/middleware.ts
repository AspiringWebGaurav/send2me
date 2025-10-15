import { NextRequest, NextResponse } from "next/server";

const VERIFIED_COOKIE_NAME = "verified";

// Enhanced public paths with more granular control
const PUBLIC_PATHS = new Set<string>([
  "/verify",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/dummy-user.png",
]);

// Enhanced static file pattern
const STATIC_FILE_PATTERN = /\.[^/]+$/;

// Enhance bypass logic with more specific conditions
function shouldBypass(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  // Check exact public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  // Next.js internals and static files
  if (pathname.startsWith("/_next")) {
    return true;
  }

  // Allow verification and turnstile API routes
  if (
    pathname.startsWith("/api/verify") ||
    pathname.startsWith("/api/turnstile")
  ) {
    return true;
  }

  // Other API routes still need verification
  if (pathname.startsWith("/api")) {
    // Only specific APIs are public
    if (pathname.includes("/verify") || pathname.includes("/turnstile")) {
      return true;
    }
    return false;
  }

  // Static files bypass
  if (STATIC_FILE_PATTERN.test(pathname)) {
    return true;
  }

  return false;
}

// Enhanced security for returnTo validation
function isValidReturnTo(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("//")) return false;
  if (path.toLowerCase().startsWith("/verify")) return false;

  try {
    // Ensure it's a valid URL path component
    const testUrl = new URL(path, "http://test.com");
    return testUrl.pathname === path;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (shouldBypass(request)) {
    return NextResponse.next();
  }

  const verifiedCookie = request.cookies.get(VERIFIED_COOKIE_NAME);

  if (verifiedCookie?.value === "1") {
    return NextResponse.next();
  }

  // Enhanced redirect with safety checks
  const url = new URL("/verify", request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (
    requestedPath &&
    requestedPath !== "/verify" &&
    isValidReturnTo(requestedPath)
  ) {
    url.searchParams.set("returnTo", requestedPath);
  }

  // Use rewrite instead of redirect for protected routes to prevent any content flash
  // This ensures the /verify page is rendered without changing the URL
  return NextResponse.rewrite(url);
}

// Enhanced matcher configuration
export const config = {
  matcher: [
    // Match root
    "/",
    // Match all paths except allowed ones
    "/((?!_next/static|_next/image|api/verify|api/turnstile|verify|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|dummy-user\\.png).*)",
  ],
};
