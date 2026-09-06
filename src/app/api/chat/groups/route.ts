import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createGroup, listGroups } from "@/lib/chatServer";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const groups = await listGroups(session.username);
    return NextResponse.json({ ok: true, groups });
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
    const title = String(body.title || "").trim();
    const members = Array.isArray(body.members)
      ? body.members.map((m: unknown) => String(m).trim()).filter(Boolean)
      : [];
    if (members.length < 1) {
      return NextResponse.json({ error: "Chọn ít nhất 1 thành viên" }, { status: 400 });
    }
    const g = await createGroup(session.username, title, members);
    return NextResponse.json({ ok: true, group: g });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
