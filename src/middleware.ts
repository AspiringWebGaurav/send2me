import { NextRequest, NextResponse } from "next/server";

const VERIFIED_COOKIE_NAME = "verified";

const PUBLIC_PATHS = new Set<string>([
  "/verify",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/dummy-user.png",
]);

const STATIC_FILE_PATTERN = /\.[^/]+$/;

function shouldBypass(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/api")) {
    return true;
  }

  if (STATIC_FILE_PATTERN.test(pathname)) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  if (shouldBypass(request)) {
    return NextResponse.next();
  }

  const verifiedCookie = request.cookies.get(VERIFIED_COOKIE_NAME);

  if (verifiedCookie?.value === "1") {
    return NextResponse.next();
  }

  const redirectUrl = new URL("/verify", request.nextUrl.origin);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (requestedPath && requestedPath !== "/verify") {
    redirectUrl.searchParams.set("redirectTo", requestedPath);
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|api|verify|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|dummy-user\\.png).*)",
  ],
};
