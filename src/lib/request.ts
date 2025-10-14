import { type NextRequest } from "next/server";

/**
 * Extracts the best-effort originating IP address from a Next.js request.
 */
export function getRequestIp(req: NextRequest): string | null {
  if (!req) {
    return null;
  }

  if (req.ip) {
    return req.ip;
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const [first] = forwardedFor.split(",");
  return first?.trim() || null;
}
