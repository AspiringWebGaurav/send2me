import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import type { MessageRecord, UserProfile } from "@/types";
import { normalize } from "./moderation";
import { logger } from "./logger";

const USERS_COLLECTION = "users";
const USERNAMES_COLLECTION = "usernames";
const MESSAGES_COLLECTION = "messages";
const RATE_LIMIT_COLLECTION = "rateLimits";

/* ---------- USER HELPERS ---------- */
function deserializeUser(
  doc: FirebaseFirestore.DocumentSnapshot
): UserProfile | null {
  if (!doc.exists) return null;
  const data = doc.data() as Record<string, unknown>;
  return {
    uid: doc.id,
    email: String(data.email ?? ""),
    username: String(data.username ?? ""),
    linkSlug: String(data.linkSlug ?? ""),
    agreedToTOS: Boolean(data.agreedToTOS),
    agreedAt:
      (data.agreedAt as FirebaseFirestore.Timestamp)?.toDate() ?? new Date(),
    createdAt:
      (data.createdAt as FirebaseFirestore.Timestamp)?.toDate() ?? new Date(),
    updatedAt:
      (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate() ?? new Date(),
  };
}

/* ---------- MESSAGE HELPERS ---------- */
function deserializeMessage(
  doc: FirebaseFirestore.DocumentSnapshot
): MessageRecord {
  const data = doc.data() as any;
  return {
    id: doc.id,
    toUid: String(data.toUid),
    toUsername: String(data.toUsername),
    text: String(data.text),
    fromUid: data.fromUid ?? null,
    fromUsername: data.fromUsername ?? null,
    fromEmail: data.fromEmail ?? null,
    fromGivenName: data.fromGivenName ?? null,
    fromFamilyName: data.fromFamilyName ?? null,
    anon: Boolean(data.anon),
    meta: {
      ipHash: data.meta?.ipHash ?? null,
      uaHash: data.meta?.uaHash ?? null,
      country: data.meta?.country ?? null,
      device: data.meta?.device ?? null,
    },
    createdAt:
      (data.createdAt as FirebaseFirestore.Timestamp)?.toDate() ?? new Date(),
  };
}

function isMissingIndexError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: number | string }).code;
  const message = (error as { message?: unknown }).message;
  const details = (error as { details?: unknown }).details;
  const messageText = typeof message === "string" ? message : "";
  const detailsText = typeof details === "string" ? details : "";
  return (
    (code === 9 ||
      code === "9" ||
      code === "FAILED_PRECONDITION" ||
      messageText.includes("FAILED_PRECONDITION")) &&
    (messageText.includes("index") || detailsText.includes("index"))
  );
}

/* ---------- USER LOOKUPS ---------- */
export async function getUserByUid(uid: string) {
  const db = getAdminDb();
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  return deserializeUser(doc);
}

export async function getUserByUsername(username: string) {
  const db = getAdminDb();
  const query = await db
    .collection(USERS_COLLECTION)
    .where("username", "==", normalize(username))
    .limit(1)
    .get();
  if (query.empty) return null;
  return deserializeUser(query.docs[0]);
}

/* ---------- USERNAME RESERVATION ---------- */
export async function reserveUsername({
  uid,
  username,
  email,
  baseUrl,
}: {
  uid: string;
  username: string;
  email: string;
  baseUrl?: string;
}) {
  const db = getAdminDb();
  const usernameKey = normalize(username);

  await db.runTransaction(async (tx) => {
    const usernameRef = db.collection(USERNAMES_COLLECTION).doc(usernameKey);
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const existing = await tx.get(usernameRef);
    if (existing.exists && existing.data()?.uid !== uid) {
      throw new Error("Username already taken.");
    }

    tx.set(
      usernameRef,
      { uid, createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    tx.set(
      userRef,
      {
        email,
        username: usernameKey,
        linkSlug: usernameKey,
        agreedToTOS: true,
        agreedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  const defaultBase =
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "https://send2me.vercel.app";

  const resolvedBase = baseUrl ?? defaultBase;
  const normalizedBase = resolvedBase.endsWith("/")
    ? resolvedBase.slice(0, -1)
    : resolvedBase;
  return `${normalizedBase}/u/${usernameKey}`;
}

/* ---------- MESSAGE CREATION ---------- */
export async function saveMessage({
  toUid,
  toUsername,
  text,
  fromUid,
  fromUsername,
  fromEmail,
  fromGivenName,
  fromFamilyName,
  anon,
  meta,
}: {
  toUid: string;
  toUsername: string;
  text: string;
  fromUid: string | null;
  fromUsername: string | null;
  fromEmail?: string | null;
  fromGivenName?: string | null;
  fromFamilyName?: string | null;
  anon: boolean;
  meta: {
    ipHash: string | null;
    uaHash: string | null;
    country: string | null;
    device?: string | null;
  };
}) {
  const db = getAdminDb();
  await db.collection(MESSAGES_COLLECTION).add({
    toUid,
    toUsername,
    text,
    anon,
    fromUid: anon ? null : fromUid,
    fromUsername: anon ? null : fromUsername,
    fromEmail: anon ? null : fromEmail ?? null,
    fromGivenName: anon ? null : fromGivenName ?? null,
    fromFamilyName: anon ? null : fromFamilyName ?? null,
    meta,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/* ---------- MESSAGE LIST / STATS ---------- */
export async function listMessages({
  uid,
  filter,
  limit = 50,
}: {
  uid: string;
  filter?: "all" | "anon" | "identified";
  limit?: number;
}) {
  const db = getAdminDb();
  let q: FirebaseFirestore.Query = db
    .collection(MESSAGES_COLLECTION)
    .where("toUid", "==", uid);
  if (filter === "anon") q = q.where("anon", "==", true);
  else if (filter === "identified") q = q.where("anon", "==", false);
  q = q.orderBy("createdAt", "desc").limit(limit);

  try {
    const snap = await q.get();
    return snap.docs.map(deserializeMessage);
  } catch (error) {
    if (!isMissingIndexError(error)) throw error;
    logger.warn(
      "Missing Firestore index for listMessages. Falling back to local sort.",
      { uid, filter }
    );
    const fallback = await db
      .collection(MESSAGES_COLLECTION)
      .where("toUid", "==", uid)
      .get();
    let messages = fallback.docs.map(deserializeMessage);
    if (filter === "anon") {
      messages = messages.filter((message) => message.anon);
    } else if (filter === "identified") {
      messages = messages.filter((message) => !message.anon);
    }
    messages = messages.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    return limit > 0 ? messages.slice(0, limit) : messages;
  }
}

export async function getMessageStats({ uid }: { uid: string }) {
  const db = getAdminDb();
  const base = db.collection(MESSAGES_COLLECTION).where("toUid", "==", uid);
  try {
    const [total, anon, identified] = await Promise.all([
      base.count().get(),
      base.where("anon", "==", true).count().get(),
      base.where("anon", "==", false).count().get(),
    ]);
    return {
      total: total.data().count ?? 0,
      anon: anon.data().count ?? 0,
      identified: identified.data().count ?? 0,
    };
  } catch (error) {
    if (!isMissingIndexError(error)) throw error;
    logger.warn(
      "Missing Firestore index for getMessageStats. Falling back to aggregation.",
      { uid }
    );
    const snapshot = await base.get();
    const msgs = snapshot.docs.map(deserializeMessage);
    const anonCount = msgs.filter((m) => m.anon).length;
    return {
      total: msgs.length,
      anon: anonCount,
      identified: msgs.length - anonCount,
    };
  }
}

/* ---------- RATE LIMIT HELPERS ---------- */
export async function incrementRateLimit(
  key: string,
  windowMs: number,
  limit: number
) {
  const db = getAdminDb();
  const now = Date.now();
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as
      | { count: number; windowStartedAt: number }
      | undefined;
    if (!snap.exists || !data) {
      tx.set(ref, {
        count: 1,
        windowStartedAt: now,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true, remaining: limit - 1 };
    }

    const diff = now - data.windowStartedAt;
    if (diff > windowMs) {
      tx.set(
        ref,
        {
          count: 1,
          windowStartedAt: now,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { allowed: true, remaining: limit - 1 };
    }

    if (data.count >= limit) return { allowed: false, remaining: 0 };
    tx.update(ref, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { allowed: true, remaining: limit - (data.count + 1) };
  });
}

export async function cleanupRateLimitKey(key: string) {
  const db = getAdminDb();
  try {
    await db.collection(RATE_LIMIT_COLLECTION).doc(key).delete();
  } catch (err) {
    logger.warn("Failed to cleanup rate limit key", key, err);
  }
}
