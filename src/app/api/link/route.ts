import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { reserveUsername } from "@/lib/firestore";
import { validateUsername } from "@/lib/moderation";
import { logger } from "@/lib/logger";

const payloadSchema = z.object({
  username: z.string().min(3).max(20),
  agree: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { username, agree } = payloadSchema.parse(json);

    if (!agree) {
      return NextResponse.json(
        { ok: false, error: "You must accept the terms to continue." },
        { status: 400 },
      );
    }

    validateUsername(username);

    const origin = req.headers.get("origin") ?? req.nextUrl.origin;

    const publicUrl = await reserveUsername({
      uid: session.uid,
      username,
      email: session.email,
      baseUrl: origin ?? undefined,
    });

    return NextResponse.json({ ok: true, publicUrl });
  } catch (error) {
    logger.error("Failed to create/update link", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
    }
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to create link right now. Try again soon.",
      },
      { status: 500 },
    );
  }
}
