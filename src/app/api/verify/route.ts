import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { TurnstileConfigurationError, verifyTurnstileToken } from "@/lib/turnstile";

const requestSchema = z.object({
  token: z.string().min(1, "Turnstile token missing."),
});

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const { token } = requestSchema.parse(body);
    const verificationResult = await verifyTurnstileToken(token);

    if (!verificationResult.success) {
      return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });

    response.cookies.set({
      name: "verified",
      value: "1",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }

    if (error instanceof TurnstileConfigurationError) {
      return NextResponse.json(
        { ok: false, error: "Verification service misconfigured. Please contact support." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
