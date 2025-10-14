import { logger } from "@/lib/logger";

const TURNSTILE_VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 5000;

export interface TurnstileServerVerificationResult {
  success: boolean;
  errors: string[];
}

export interface TurnstileVerificationOptions {
  /**
   * Optional client IP forwarded to Cloudflare for increased accuracy.
   */
  ip?: string | null;
  /**
   * Optional timeout override (milliseconds). Defaults to 5 seconds.
   */
  timeoutMs?: number;
}

const ERROR_CODE_MESSAGES: Record<string, string> = {
  "missing-input-secret": "Server verification misconfigured. Please contact support.",
  "invalid-input-secret": "Server verification misconfigured. Please contact support.",
  "missing-input-response": "Verification token missing. Please retry the challenge.",
  "invalid-input-response": "Verification failed. Please refresh the challenge.",
  "bad-request": "Verification request was rejected. Try again.",
  "timeout-or-duplicate": "Verification expired. Please retry the challenge.",
  "internal-error": "Verification service is unavailable. Please retry in a moment.",
  "network-error": "Unable to reach the verification service. Check your connection and retry.",
  "timeout-or-abort": "Verification timed out. Please retry the challenge.",
  "http-error": "Verification service returned an unexpected response. Please retry.",
  "invalid-json": "Verification service returned an invalid response. Please retry.",
};

export class TurnstileConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TurnstileConfigurationError";
  }
}

function resolveTimeout(timeoutMs?: number): number {
  const candidate = typeof timeoutMs === "number" && Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;
  return Math.max(1000, Math.min(candidate, 15000));
}

export function describeTurnstileErrors(errors: string[]): string {
  if (!errors.length) {
    return "Turnstile verification failed. Please refresh the challenge and try again.";
  }

  const uniqueErrors = Array.from(new Set(errors));
  const messages = uniqueErrors
    .map((code) => ERROR_CODE_MESSAGES[code] ?? null)
    .filter((message): message is string => Boolean(message));

  if (messages.length) {
    return messages.join(" ");
  }

  return "Turnstile verification failed. Please refresh the challenge and try again.";
}

/**
 * Performs server-side verification of a Cloudflare Turnstile token.
 */
export async function verifyTurnstileToken(
  token: string,
  options?: TurnstileVerificationOptions,
): Promise<TurnstileServerVerificationResult> {
  const trimmedToken = token?.trim();
  if (!trimmedToken) {
    return {
      success: false,
      errors: ["missing-input-response"],
    };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new TurnstileConfigurationError("Missing TURNSTILE_SECRET_KEY environment variable.");
  }

  const formData = new URLSearchParams({
    secret,
    response: trimmedToken,
  });

  if (options?.ip) {
    formData.set("remoteip", options.ip);
  }

  const timeoutMs = resolveTimeout(options?.timeoutMs);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutHandle);

    if (error instanceof Error && error.name === "AbortError") {
      logger.error("Turnstile verification request timed out", { timeoutMs });
      return {
        success: false,
        errors: ["timeout-or-abort"],
      };
    }

    logger.error("Turnstile verification request failed", error);
    return {
      success: false,
      errors: ["network-error"],
    };
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    logger.error("Turnstile verification HTTP failure", response.status, response.statusText);
    return {
      success: false,
      errors: ["http-error"],
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    logger.error("Turnstile verification response parsing failed", error);
    return {
      success: false,
      errors: ["invalid-json"],
    };
  }

  if (!payload || typeof payload !== "object") {
    logger.error("Turnstile verification returned unexpected payload", payload);
    return {
      success: false,
      errors: ["invalid-json"],
    };
  }

  const result = payload as {
    success?: unknown;
    "error-codes"?: unknown;
  };

  const isSuccess = Boolean(result.success);
  const errors =
    Array.isArray(result["error-codes"]) && result["error-codes"].every((code) => typeof code === "string")
      ? (result["error-codes"] as string[])
      : [];

  return {
    success: isSuccess,
    errors,
  };
}
