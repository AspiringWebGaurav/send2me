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

    const originHeader = req.headers.get("origin");
    const forwardedProtoHeader = req.headers.get("x-forwarded-proto");
    const forwardedHostHeader = req.headers.get("x-forwarded-host");
    const hostHeader = req.headers.get("host");

    const origin =
      originHeader && originHeader.toLowerCase() !== "null"
        ? originHeader
        : null;

    const forwardedProto = forwardedProtoHeader
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();
    const forwardedHost = forwardedHostHeader?.split(",")[0]?.trim();
    const host = hostHeader?.split(",")[0]?.trim();

    const fallbackProto =
      forwardedProto ??
      (req.nextUrl.protocol ? req.nextUrl.protocol.replace(/:$/, "") : null) ??
      "https";

    const forwardedOrigin = forwardedHost
      ? `${fallbackProto}://${forwardedHost}`
      : null;

    const hostOrigin = host ? `${fallbackProto}://${host}` : null;

    const baseCandidate =
      origin ?? forwardedOrigin ?? hostOrigin ?? req.nextUrl.origin;

    const publicUrl = await reserveUsername({
      uid: session.uid,
      username,
      email: session.email,
      baseUrl: baseCandidate ?? undefined,
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
