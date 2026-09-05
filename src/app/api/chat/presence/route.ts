import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { touchPresence, getPresenceMap } from "@/lib/chatServer";

export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    await touchPresence(session.username);
    return NextResponse.json({ ok: true, at: Date.now() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    await touchPresence(session.username);
    const q = req.nextUrl.searchParams.get("users") || "";
    const names = q
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 50);
    const map = await getPresenceMap(names);
    return NextResponse.json({ me: Date.now(), presence: map });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
