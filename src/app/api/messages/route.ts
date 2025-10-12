import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listMessages } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const filterParam = searchParams.get("filter");
  const filter =
    filterParam === "anon"
      ? "anon"
      : filterParam === "identified"
      ? "identified"
      : ("all" as const);

  const messages = await listMessages({
    uid: session.uid,
    filter: filter === "all" ? undefined : filter,
  });

  return NextResponse.json({
    ok: true,
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      anon: m.anon,
      fromUsername: m.fromUsername,
      fromEmail: m.fromEmail ?? null,
      // combine first and last names if available
      fromGivenName: m.fromGivenName ?? null,
      fromFamilyName: m.fromFamilyName ?? null,
      fullName:
        m.fromGivenName || m.fromFamilyName
          ? [m.fromGivenName, m.fromFamilyName].filter(Boolean).join(" ")
          : null,
      country: m.meta?.country ?? null,
      device: m.meta?.device ?? null,
    })),
  });
}