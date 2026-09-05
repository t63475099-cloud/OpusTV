import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { setTyping, getTypingFrom, areFriends } from "@/lib/chatServer";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const to = String(body.to || "").trim().toLowerCase();
    if (!to) return NextResponse.json({ error: "Thiếu người nhận" }, { status: 400 });
    if (!(await areFriends(session.username, to))) {
      return NextResponse.json({ error: "Chưa kết bạn" }, { status: 403 });
    }
    await setTyping(session.username, to);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const peer = String(req.nextUrl.searchParams.get("peer") || "").trim().toLowerCase();
    if (!peer) return NextResponse.json({ typing: false });
    const typing = await getTypingFrom(peer, session.username);
    return NextResponse.json({ typing });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
