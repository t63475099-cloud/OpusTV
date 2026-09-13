import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createGroup, listGroups } from "@/lib/chatServer";
import { formatDbError } from "@/lib/neonSql";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.username) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }
    const groups = await listGroups(session.username);
    return NextResponse.json({ ok: true, groups });
  } catch (e: unknown) {
    const msg = formatDbError(e);
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
    const msg = formatDbError(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
