import { logger } from "@/lib/logger";

const TURNSTILE_VERIFY_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileServerVerificationResult {
  success: boolean;
  errors: string[];
}

export class TurnstileConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TurnstileConfigurationError";
  }
}

/**
 * Performs server-side verification of a Cloudflare Turnstile token.
 */
export async function verifyTurnstileToken(token: string): Promise<TurnstileServerVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new TurnstileConfigurationError("Missing TURNSTILE_SECRET_KEY environment variable.");
  }

  const formData = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    logger.error("Turnstile verification network error", response.status, response.statusText);
    return {
      success: false,
      errors: [`HTTP ${response.status}`],
    };
  }

  const data = (await response.json()) as {
    success: boolean;
    "error-codes"?: string[];
  };

  return {
    success: Boolean(data.success),
    errors: data["error-codes"] ?? [],
  };
}
