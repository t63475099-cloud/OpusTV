import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listGroupMessages, sendGroupMessage } from "@/lib/chatServer";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const groupId = String(req.nextUrl.searchParams.get("groupId") || "").trim();
    if (!groupId) {
      return NextResponse.json({ error: "Thiếu groupId" }, { status: 400 });
    }
    const rows = await listGroupMessages(groupId, session.username);
    const messages = rows.map((r) => ({
      id: String(r.id),
      conversationId: String(r.group_id),
      senderId: String(r.from_user),
      text: String(r.body || ""),
      timestamp: r.created_at ? new Date(String(r.created_at)).getTime() : Date.now(),
      status: "delivered" as const,
      replyToId: r.reply_to ? String(r.reply_to) : undefined,
      attachments: Array.isArray(r.attachments) ? r.attachments : [],
    }));
    return NextResponse.json({ ok: true, messages });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const groupId = String(body.groupId || "").trim();
    const text = String(body.text || "");
    if (!groupId) {
      return NextResponse.json({ error: "Thiếu groupId" }, { status: 400 });
    }
    const r = await sendGroupMessage({
      groupId,
      from: session.username,
      text,
      replyTo: body.replyTo ? String(body.replyTo) : undefined,
      attachments: body.attachments || [],
    });
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
