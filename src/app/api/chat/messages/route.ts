import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  ensureChatTables,
  getThread,
  listInbox,
  markThreadRead,
  sendMessage,
  unreadCount,
} from "@/lib/chatServer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureChatTables();
    const withUser = req.nextUrl.searchParams.get("with");
    if (withUser) {
      const messages = await getThread(session.username, withUser);
      await markThreadRead(session.username, withUser);
      return NextResponse.json({ ok: true, messages });
    }
    const inbox = await listInbox(session.username);
    const withUnread = await Promise.all(
      inbox.map(async (row) => ({
        ...row,
        unread: await unreadCount(session.username, row.peer),
      }))
    );
    return NextResponse.json({ ok: true, inbox: withUnread });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const to = String(body.to || "").trim();
    const text = String(body.text || body.body || "").trim();
    const replyTo = body.replyTo ? String(body.replyTo) : null;
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (!to) {
      return NextResponse.json({ error: "Thiếu người nhận" }, { status: 400 });
    }
    if (!text && attachments.length === 0) {
      return NextResponse.json({ error: "Tin nhắn trống" }, { status: 400 });
    }
    const id = await sendMessage({
      from: session.username,
      to,
      body: text,
      replyTo,
      attachments,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
