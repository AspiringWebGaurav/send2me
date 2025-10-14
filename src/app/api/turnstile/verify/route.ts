import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getRequestIp } from "@/lib/request";
import {
  describeTurnstileErrors,
  verifyTurnstileToken,
  TurnstileConfigurationError,
} from "@/lib/turnstile";

const payloadSchema = z.object({
  token: z.string().min(10, "Turnstile token missing."),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { token } = payloadSchema.parse(json);
    const ip = getRequestIp(req);

    const result = await verifyTurnstileToken(token, { ip });

    if (!result.success) {
      const message = describeTurnstileErrors(result.errors);
      logger.warn("Turnstile verification API rejected token", {
        errors: result.errors,
        ip,
      });

      return NextResponse.json(
        {
          ok: false,
          error: message,
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TurnstileConfigurationError) {
      logger.error("Turnstile verification API misconfigured", error);
      return NextResponse.json(
        { ok: false, error: "Turnstile is not configured on the server. Please contact support." },
        { status: 500 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid verification payload." }, { status: 400 });
    }

    logger.error("Turnstile verification API failed to process request", error);
    return NextResponse.json(
      { ok: false, error: "Unable to verify the Turnstile token right now. Please retry." },
      { status: 500 },
    );
  }
}
