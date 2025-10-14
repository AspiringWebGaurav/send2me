import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE_PATTERN = /\.(.*)$/;

function shouldBypass(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/verify") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname === "/manifest.webmanifest") {
    return true;
  }
  if (PUBLIC_FILE_PATTERN.test(pathname)) return true;
  if (request.method !== "GET") return true;

  return false;
}

function resolveIp(request: NextRequest): string | null {
  if (request.ip) {
    return request.ip;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    if (first && first.trim().length > 0) {
      return first.trim();
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] inspecting request", {
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
    });
  }

  if (shouldBypass(request)) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[middleware] bypassing request", request.nextUrl.pathname);
    }
    return NextResponse.next();
  }

  const originalPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const ip = resolveIp(request);

  const verifyUrl = new URL("/api/verify", request.nextUrl.origin);

  const headers = new Headers({
    "x-verification-middleware": "1",
  });
  if (ip) {
    headers.set("x-verification-forwarded-for", ip);
  }

  const response = await fetch(verifyUrl, {
    method: "GET",
    headers,
    cache: "no-store",
    credentials: "omit",
  }).catch(() => null);

  if (!response || !response.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[middleware] verification check failed", {
        status: response?.status ?? null,
      });
    }
    return redirectToVerification(request, originalPath);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.log("[middleware] verification JSON parsing failed");
    }
    return redirectToVerification(request, originalPath);
  }

  const data = payload as { verified?: unknown };
  const isVerified = Boolean(data && data.verified === true);

  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] verification result", { isVerified, payload: data });
  }

  if (isVerified) {
    return NextResponse.next();
  }

  return redirectToVerification(request, originalPath);
}

function redirectToVerification(request: NextRequest, originalPath: string) {
  const verifyUrl = new URL("/verify", request.nextUrl.origin);
  if (originalPath && originalPath !== "/verify") {
    verifyUrl.searchParams.set("redirectTo", originalPath);
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] redirecting to verification", verifyUrl.toString());
  }
  return NextResponse.redirect(verifyUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
