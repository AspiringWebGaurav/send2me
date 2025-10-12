import "server-only";

import {
  getApps,
  initializeApp,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { logger } from "./logger";

let app: App | null = null;
let firestore: Firestore | null = null;

/**
 * Normalize and validate a PEM-format private key.
 * Converts escaped newlines into actual ones, trims, and ensures headers.
 */
function normalizePrivateKey(key?: string | null): string | undefined {
  if (!key) return undefined;
  if (key.includes("YOUR_KEY") || key.includes("REPLACE")) return undefined;

  // Replace escaped newlines with real ones
  let normalized = key.replace(/\\n/g, "\n").replace(/\r/g, "").trim();

  // Ensure proper PEM header/footer exist
  if (!normalized.includes("PRIVATE KEY")) return undefined;
  if (!normalized.startsWith("-----BEGIN PRIVATE KEY-----")) {
    normalized = `-----BEGIN PRIVATE KEY-----\n${normalized}`;
  }
  if (!normalized.endsWith("-----END PRIVATE KEY-----")) {
    normalized = `${normalized}\n-----END PRIVATE KEY-----`;
  }

  // Make sure there’s a trailing newline (PEM parser is picky)
  if (!normalized.endsWith("\n")) normalized += "\n";

  return normalized;
}

/**
 * Load Firebase service account credentials.
 * Tries multiple sources so deployment and local dev both work.
 */
function loadServiceAccount(): ServiceAccount | null {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  // --- 1️⃣ Base64-encoded JSON ---
  if (base64) {
    try {
      const decoded = Buffer.from(base64, "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      const privateKey = normalizePrivateKey(parsed.private_key);
      if (parsed.project_id && parsed.client_email && privateKey) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey,
        } as ServiceAccount;
      }
    } catch (error) {
      logger.warn("Unable to parse FIREBASE_SERVICE_ACCOUNT_BASE64", error);
    }
  }

  // --- 2️⃣ Inline JSON string (already parsed) ---
  if (inlineJson) {
    try {
      const parsed = JSON.parse(inlineJson);
      const privateKey = normalizePrivateKey(parsed.private_key);
      if (parsed.project_id && parsed.client_email && privateKey) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey,
        } as ServiceAccount;
      }
    } catch (error) {
      logger.warn("Unable to parse FIREBASE_SERVICE_ACCOUNT_JSON", error);
    }
  }

  // --- 3️⃣ Local JSON file path ---
  if (jsonPath) {
    try {
      const json = require(jsonPath);
      const privateKey = normalizePrivateKey(json.private_key);
      if (json.project_id && json.client_email && privateKey) {
        return {
          projectId: json.project_id,
          clientEmail: json.client_email,
          privateKey,
        } as ServiceAccount;
      }
    } catch (error) {
      logger.warn("Unable to read FIREBASE_SERVICE_ACCOUNT_PATH", error);
    }
  }

  // --- 4️⃣ Default env vars (recommended) ---
  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? undefined;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount;
  }

  return null;
}

/**
 * Initialize Firebase Admin SDK (singleton pattern).
 */
function createAdminApp() {
  if (app) return app;

  const serviceAccount = loadServiceAccount();

  if (!serviceAccount) {
    logger.error(
      [
        "❌ Firebase Admin credentials missing or invalid.",
        "Set one of the following in your environment:",
        "  • FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 JSON)",
        "  • FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON)",
        "  • FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)",
        "  • FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY",
      ].join("\n")
    );
    throw new Error("Firebase Admin SDK is not configured with a valid key.");
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
}

/**
 * Get initialized Firebase Admin app.
 */
export function getAdminApp() {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }
  return createAdminApp();
}

/**
 * Get Firestore instance.
 */
export function getAdminDb() {
  if (!firestore) {
    firestore = getFirestore(getAdminApp());
  }
  return firestore;
}

/**
 * Get Auth instance.
 */
export function getAdminAuth() {
  return getAuth(getAdminApp());
}
