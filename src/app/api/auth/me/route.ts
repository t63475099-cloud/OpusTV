import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { ensureUserUid, findUserByUsername } from "@/lib/db/users";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, user: null, error: "no_database" });
    }
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, user: null });
    }
    const uid = await ensureUserUid(session.userId);
    const user = await findUserByUsername(session.username);
    return NextResponse.json({
      ok: true,
      user: {
        id: session.userId,
        username: session.username,
        uid,
        verified: !!(user as { verified?: number } | null)?.verified,
      },
    });
  } catch (e) {
    console.error("me", e);
    return NextResponse.json({ ok: false, user: null });
  }
}
