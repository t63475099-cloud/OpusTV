import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  ensureChatTables,
  createCall,
  getCall,
  listIncomingCalls,
  acceptCall,
  rejectOrEndCall,
  appendIce,
  areFriends,
} from "@/lib/chatServer";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await ensureChatTables();
    const id = req.nextUrl.searchParams.get("id");
    const incoming = req.nextUrl.searchParams.get("incoming");
    if (id) {
      const call = await getCall(id);
      if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const me = user.username.toLowerCase();
      if (
        String(call.from_user).toLowerCase() !== me &&
        String(call.to_user).toLowerCase() !== me
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ call });
    }
    if (incoming === "1") {
      const list = await listIncomingCalls(user.username);
      return NextResponse.json({ incoming: list });
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const me = user.username;

    if (action === "offer") {
      const to = String(body.to || "").toLowerCase();
      const mode = body.mode === "video" ? "video" : "audio";
      const offerSdp = String(body.offerSdp || "");
      const id = String(body.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      if (!to || !offerSdp) {
        return NextResponse.json({ error: "Thiếu thông tin cuộc gọi" }, { status: 400 });
      }
      if (!(await areFriends(me, to))) {
        return NextResponse.json({ error: "Chỉ gọi được bạn bè" }, { status: 403 });
      }
      await createCall({ id, from: me, to, mode, offerSdp });
      return NextResponse.json({ ok: true, id });
    }

    if (action === "answer") {
      const id = String(body.id || "");
      const answerSdp = String(body.answerSdp || "");
      if (!id || !answerSdp) {
        return NextResponse.json({ error: "Thiếu answer" }, { status: 400 });
      }
      await acceptCall(id, me, answerSdp);
      return NextResponse.json({ ok: true });
    }

    if (action === "ice") {
      const id = String(body.id || "");
      const candidate = body.candidate;
      if (!id || !candidate) {
        return NextResponse.json({ error: "Thiếu ICE" }, { status: 400 });
      }
      await appendIce(id, me, candidate);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      await rejectOrEndCall(String(body.id || ""), me, "rejected");
      return NextResponse.json({ ok: true });
    }

    if (action === "end") {
      await rejectOrEndCall(String(body.id || ""), me, "ended");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi" },
      { status: 500 }
    );
  }
}
