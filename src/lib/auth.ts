import "server-only";

import type { NextRequest } from "next/server";
import { getAdminAuth } from "./firebaseAdmin";
import { getUserByUid } from "./firestore";
import type { SessionUser } from "@/types";
import { logger } from "./logger";

const AUTH_HEADER = "authorization";

function parseAuthHeader(value: string | null) {
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length !== 2) return null;
  const [type, token] = parts;
  if (type.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function getTokenFromRequest(req: NextRequest | Request) {
  const headerValue =
    req.headers.get(AUTH_HEADER) ?? req.headers.get(AUTH_HEADER.toUpperCase());
  return parseAuthHeader(headerValue);
}

export async function verifyToken(token: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token, true);
  return decoded;
}

/**
 * Retrieves the session user associated with the given request.
 * Always includes displayName and email (using Google profile or fallbacks).
 */
export async function getSessionUser(req: NextRequest | Request): Promise<SessionUser | null> {
  try {
    const token = await getTokenFromRequest(req);
    if (!token) return null;

    const decoded = await verifyToken(token);
    const profile = await getUserByUid(decoded.uid);

    const auth = getAdminAuth();

    // Try to get richer Google user record details
    let displayName: string | null = null;
    let email: string | null = decoded.email ?? null;

    try {
      const userRecord = await auth.getUser(decoded.uid);
      displayName = userRecord.displayName ?? null;
      if (!email && userRecord.email) {
        email = userRecord.email;
      }
    } catch (e) {
      // Fallback to ID token fields
      displayName = (decoded as any).name ?? null;
    }

    // Fallback: if no displayName, use part before '@' in email
    if (!displayName && email) {
      displayName = email.split("@")[0];
    }

    return {
      uid: decoded.uid,
      email: email ?? profile?.email ?? "",
      username: profile?.username ?? null,
      linkSlug: profile?.linkSlug ? profile.linkSlug : null,
      linkUrl: profile?.linkUrl ? profile.linkUrl : null,
      displayName: displayName ?? null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Failed to parse private key") ||
      message.includes("Firebase Admin credentials not configured") ||
      message.includes("invalid credential")
    ) {
      logger.error("Firebase Admin configuration error", error);
      throw error;
    }
    logger.warn("Failed to verify session token", error);
    return null;
  }
}
