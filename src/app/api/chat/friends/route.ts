import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  addFriendByUid,
  ensureChatTables,
  getPublicProfile,
  listFriends,
} from "@/lib/chatServer";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureChatTables();
    const [friends, me] = await Promise.all([
      listFriends(session.username),
      getPublicProfile(session.username),
    ]);
    return NextResponse.json({
      ok: true,
      me: me ? { username: me.username, uid: me.uid } : { username: session.username, uid: null },
      friends,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const uid = String(body.uid || body.query || "").trim();
    if (!/^\d{6,12}$/.test(uid)) {
      return NextResponse.json(
        { error: "Nhập đúng UID (dãy số trên trang Tài khoản của đối phương)" },
        { status: 400 }
      );
    }
    const friend = await addFriendByUid(session.username, uid);
    return NextResponse.json({ ok: true, friend });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
