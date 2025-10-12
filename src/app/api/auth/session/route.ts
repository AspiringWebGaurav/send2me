import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ ok: true, user: null });
  }

  return NextResponse.json({
    ok: true,
    user: {
      uid: session.uid,
      email: session.email,
      username: session.username,
      linkSlug: session.linkSlug,
      linkUrl: session.linkUrl,
    },
  });
}
