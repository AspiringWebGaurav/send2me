import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMessageStats } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getMessageStats({ uid: session.uid });

  return NextResponse.json({
    ok: true,
    stats,
  });
}