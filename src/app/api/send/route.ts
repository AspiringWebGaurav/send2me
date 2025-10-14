import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getUserByUsername, saveMessage } from "@/lib/firestore";
import { validateMessage, normalize } from "@/lib/moderation";
import { assertNotRateLimited, hashValue, RateLimitError } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { getRequestIp } from "@/lib/request";
import { verifyTurnstileToken, TurnstileConfigurationError, describeTurnstileErrors } from "@/lib/turnstile";

const payloadSchema = z.object({
  to: z.string().min(3).max(32),
  text: z.string().min(1).max(500),
  anon: z.boolean().optional().default(true),
  turnstileToken: z.string().min(10, "Turnstile verification is required."),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { to, text, anon, turnstileToken } = payloadSchema.parse(json);
    const ip = getRequestIp(req);

    const turnstileResult = await verifyTurnstileToken(turnstileToken, { ip });
    if (!turnstileResult.success) {
      const errorMessage = describeTurnstileErrors(turnstileResult.errors);
      logger.warn("Turnstile verification failed for send endpoint", {
        errors: turnstileResult.errors,
        ip,
      });
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
    }

    const receiver = await getUserByUsername(normalize(to));
    if (!receiver) {
      return NextResponse.json({ ok: false, error: "Receiver not found." }, { status: 404 });
    }

    const messageText = validateMessage(text);

    const userAgent = req.headers.get("user-agent") ?? null;
    const ipHash = hashValue(ip ?? "anonymous");
    const uaHash = hashValue(userAgent ?? "unknown");

    await assertNotRateLimited({
      toUid: receiver.uid,
      ipHash,
    });

    // Get the authenticated sender (if any)
    const session = await getSessionUser(req);

    let fromEmail: string | null = null;
    let fromGivenName: string | null = null;
    let fromFamilyName: string | null = null;

    // Only populate identity info for non-anonymous authenticated senders
    if (!anon && session) {
      fromEmail = session.email ?? null;

      if (session.displayName) {
        const parts = session.displayName.trim().split(" ");
        fromGivenName = parts[0] ?? null;
        fromFamilyName = parts.length > 1 ? parts.slice(1).join(" ") : null;
      }
    }

    await saveMessage({
      toUid: receiver.uid,
      toUsername: receiver.username,
      text: messageText,
      anon: anon ?? true,
      fromUid: session?.uid ?? null,
      fromUsername: session?.username ?? null,
      fromEmail,
      fromGivenName,
      fromFamilyName,
      meta: {
        ipHash,
        uaHash,
        country: req.headers.get("x-vercel-ip-country") ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.warn("Failed to send message", error);
    if (error instanceof TurnstileConfigurationError) {
      return NextResponse.json(
        { ok: false, error: "Turnstile secret not configured on the server." },
        { status: 500 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }
    if (error instanceof RateLimitError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { ok: false, error: "Unable to send the message right now. Please try again later." },
      { status: 500 },
    );
  }
}
