import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestIp } from "@/lib/request";
import {
  describeTurnstileErrors,
  TurnstileConfigurationError,
  verifyTurnstileToken,
} from "@/lib/turnstile";
import {
  getVerificationForIp,
  hasPassedVerification,
  upsertVerificationRecord,
} from "@/lib/browserVerification";
import { logger } from "@/lib/logger";
import { VERIFICATION_IP_COOKIE, decodeVerificationCookie } from "@/lib/verificationCookie";

const verificationRequestSchema = z.object({
  token: z.string().min(10, "Turnstile token missing."),
  rayId: z.string().min(6, "Ray ID missing."),
  userAgentData: z
    .object({
      brands: z
        .array(
          z
            .object({
              brand: z.string().optional(),
              version: z.string().optional(),
            })
            .strict(),
        )
        .optional(),
      mobile: z.boolean().optional(),
      platform: z.string().optional(),
      platformVersion: z.string().optional(),
      architecture: z.string().optional(),
      model: z.string().optional(),
      uaFullVersion: z.string().optional(),
      bitness: z.string().optional(),
    })
    .partial()
    .optional(),
});

function resolveClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-verification-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first && first.trim().length > 0) {
      return first.trim();
    }
  }

  const hinted = req.cookies.get(VERIFICATION_IP_COOKIE)?.value ?? null;
  const decodedHint = decodeVerificationCookie(hinted);
  if (decodedHint) {
    return decodedHint;
  }

  return getRequestIp(req);
}

export async function GET(req: NextRequest) {
  const ip = resolveClientIp(req);
  if (!ip) {
    return NextResponse.json(
      {
        ok: true,
        verified: false,
        reason: "IP address unavailable.",
      },
      { status: 200 },
    );
  }

  const record = await getVerificationForIp(ip);

  return NextResponse.json(
    {
      ok: true,
      verified: hasPassedVerification(record),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = verificationRequestSchema.parse(body);

    const ip = resolveClientIp(req);
    if (!ip) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unable to determine the requesting IP address.",
        },
        { status: 400 },
      );
    }

    const { token, rayId, userAgentData } = payload;
    const verificationResult = await verifyTurnstileToken(token, { ip });

    if (!verificationResult.success) {
      const message = describeTurnstileErrors(verificationResult.errors);
      logger.warn("Cloudflare Turnstile verification failed", {
        ip,
        rayId,
        errors: verificationResult.errors,
      });

      return NextResponse.json(
        {
          ok: false,
          error: message,
          errors: verificationResult.errors,
        },
        { status: 400 },
      );
    }

    const userAgent = req.headers.get("user-agent") ?? null;

    await upsertVerificationRecord({
      ipAddress: ip,
      rayId,
      userAgent,
      verificationStatus: "passed",
      userAgentData: userAgentData ?? null,
    });

    logger.info("Browser verification succeeded", { ip, rayId });

    const successResponse = NextResponse.json(
      {
        ok: true,
      },
      { status: 200 },
    );
    successResponse.cookies.delete(VERIFICATION_IP_COOKIE);
    return successResponse;
  } catch (error) {
    if (error instanceof TurnstileConfigurationError) {
      logger.error("Turnstile verification failed due to missing server configuration.");
      return NextResponse.json(
        {
          ok: false,
          error: "Turnstile is not configured correctly on the server. Please contact support.",
        },
        { status: 500 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid verification payload.",
        },
        { status: 400 },
      );
    }

    logger.error("Unexpected failure while verifying browser Turnstile token.", error);
    return NextResponse.json(
      {
        ok: false,
        error: "We could not verify your browser right now. Please retry.",
      },
      { status: 500 },
    );
  }
}
