import "server-only";

import crypto from "node:crypto";
import { incrementRateLimit } from "./firestore";

export class RateLimitError extends Error {
  status = 429;
  constructor(message = "Too many requests. Please slow down.") {
    super(message);
    this.name = "RateLimitError";
  }
}

const TARGET_WINDOW_MS = 10_000; // 10 seconds
const TARGET_LIMIT = 3;
const GLOBAL_WINDOW_MS = 60_000; // 1 minute
const GLOBAL_LIMIT = 30;

function getSalt() {
  const salt = process.env.HASH_SALT;
  if (!salt) {
    throw new Error("HASH_SALT environment variable is missing.");
  }
  return salt;
}

export function hashValue(value: string | null | undefined) {
  if (!value) return null;
  return crypto.createHmac("sha256", getSalt()).update(value).digest("hex");
}

export async function assertNotRateLimited({
  toUid,
  ipHash,
}: {
  toUid: string;
  ipHash: string | null;
}) {
  if (!ipHash) {
    // Without IP we cannot rate limit effectively, reject as precaution.
    throw new RateLimitError("Missing metadata for rate limiting.");
  }

  const targetKey = `target:${toUid}:${ipHash}`;
  const globalKey = `global:${ipHash}`;

  const [targetResult, globalResult] = await Promise.all([
    incrementRateLimit(targetKey, TARGET_WINDOW_MS, TARGET_LIMIT),
    incrementRateLimit(globalKey, GLOBAL_WINDOW_MS, GLOBAL_LIMIT),
  ]);

  if (!targetResult.allowed) {
    throw new RateLimitError("You're sending messages too quickly to this user.");
  }

  if (!globalResult.allowed) {
    throw new RateLimitError("Too many messages sent. Please wait a moment.");
  }
}
