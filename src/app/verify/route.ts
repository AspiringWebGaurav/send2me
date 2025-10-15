// src/app/api/verify/route.ts

export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token" },
        { status: 400 }
      );
    }

    // Validate with Cloudflare Turnstile
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await verifyRes.json();

    if (!data.success) {
      return NextResponse.json(
        { ok: false, error: "Verification failed" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ ok: true });

    // Issue session-scoped verified cookie (no TTL)
    response.cookies.set("verified", "1", {
      path: "/",
      sameSite: "strict",
      httpOnly: true,
      secure: true,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}