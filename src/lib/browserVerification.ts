import { createHash } from "crypto";
import { Timestamp, type CollectionReference, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import { logger } from "./logger";

const COLLECTION_NAME = "browserVerifications";

export type BrowserVerificationStatus = "passed" | "failed";

export interface BrowserVerificationRecord {
  ipHash: string;
  ipAddress: string;
  userAgent: string | null;
  rayId: string;
  verificationStatus: BrowserVerificationStatus;
  userAgentData: Record<string, unknown> | null;
  firstVerifiedAt: Timestamp;
  lastVerifiedAt: Timestamp;
  updatedAt: Timestamp;
  verificationCount: number;
}

export interface UpsertVerificationInput {
  ipAddress: string;
  rayId: string;
  userAgent?: string | null;
  verificationStatus: BrowserVerificationStatus;
  userAgentData?: Record<string, unknown> | null;
}

function getCollection(db?: Firestore): CollectionReference<BrowserVerificationRecord> {
  const database = db ?? getAdminDb();
  return database.collection(COLLECTION_NAME) as CollectionReference<BrowserVerificationRecord>;
}

function computeIpHash(ip: string): string {
  return createHash("sha256").update(ip, "utf8").digest("hex");
}

function sanitizeUserAgentData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const source = data as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  if (Array.isArray(source.brands)) {
    const brands = source.brands
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const brand = typeof (entry as Record<string, unknown>).brand === "string"
          ? ((entry as Record<string, unknown>).brand as string)
          : null;
        const version = typeof (entry as Record<string, unknown>).version === "string"
          ? ((entry as Record<string, unknown>).version as string)
          : null;

        if (!brand && !version) {
          return null;
        }

        return {
          ...(brand ? { brand } : {}),
          ...(version ? { version } : {}),
        };
      })
      .filter((entry): entry is Record<string, string> => Boolean(entry));

    if (brands.length) {
      sanitized.brands = brands;
    }
  }

  if (typeof source.mobile === "boolean") {
    sanitized.mobile = source.mobile;
  }

  const allowedStringFields = [
    "platform",
    "platformVersion",
    "architecture",
    "model",
    "uaFullVersion",
    "bitness",
  ] as const;

  for (const field of allowedStringFields) {
    const value = source[field];
    if (typeof value === "string" && value.trim().length > 0) {
      sanitized[field] = value.trim();
    }
  }

  return Object.keys(sanitized).length ? sanitized : null;
}

export async function getVerificationForIp(ip: string | null | undefined) {
  if (!ip) {
    return null;
  }

  try {
    const docRef = getCollection().doc(computeIpHash(ip));
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() ?? null;
  } catch (error) {
    logger.error("Failed to fetch browser verification record", { ip, error });
    return null;
  }
}

export function hasPassedVerification(record: BrowserVerificationRecord | null | undefined): boolean {
  return Boolean(record && record.verificationStatus === "passed");
}

export async function upsertVerificationRecord(input: UpsertVerificationInput) {
  const { ipAddress, rayId, userAgent, verificationStatus } = input;
  if (!ipAddress) {
    throw new Error("Cannot persist verification without an IP address.");
  }

  const userAgentData = sanitizeUserAgentData(input.userAgentData);
  const collection = getCollection();
  const ipHash = computeIpHash(ipAddress);
  const docRef = collection.doc(ipHash);

  const now = Timestamp.now();

  try {
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      const existing = snapshot.data() ?? null;
      const previousCount =
        existing && typeof existing.verificationCount === "number" && Number.isFinite(existing.verificationCount)
          ? existing.verificationCount
          : 0;
      const verificationCount = previousCount + 1;

      await docRef.set(
        {
          ipHash,
          ipAddress,
          rayId,
          userAgent: userAgent ?? null,
          verificationStatus,
          userAgentData: userAgentData ?? null,
          firstVerifiedAt: existing?.firstVerifiedAt ?? now,
          lastVerifiedAt: now,
          updatedAt: now,
          verificationCount,
        },
        { merge: true },
      );
      return;
    }

    await docRef.set({
      ipHash,
      ipAddress,
      rayId,
      userAgent: userAgent ?? null,
      verificationStatus,
      userAgentData: userAgentData ?? null,
      firstVerifiedAt: now,
      lastVerifiedAt: now,
      updatedAt: now,
      verificationCount: 1,
    });
  } catch (error) {
    logger.error("Failed to persist browser verification record", {
      ipAddress,
      error,
    });
    throw error;
  }
}
