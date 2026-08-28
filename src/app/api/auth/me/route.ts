import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, user: null, error: "no_database" });
    }
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, user: null });
    }
    return NextResponse.json({
      ok: true,
      user: { id: session.userId, username: session.username },
    });
  } catch (e) {
    console.error("me", e);
    return NextResponse.json({ ok: false, user: null });
  }
}
