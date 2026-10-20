import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  ensureInboxTables,
  listInbox,
  unreadCount,
} from "@/lib/inboxDb";
import { sql } from "@/lib/neonSql";

export const dynamic = "force-dynamic";

function mapRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    category: String(r.category || "other"),
    kind: String(r.kind || "system"),
    title: String(r.title || ""),
    body: String(r.body || ""),
    fromUsername: r.from_username ? String(r.from_username) : null,
    refId: r.ref_id ? String(r.ref_id) : null,
    isRead: !!r.is_read,
    isHandled: !!r.is_handled,
    createdAt: r.created_at ? String(r.created_at) : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.username) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureInboxTables();
    const cat = String(req.nextUrl.searchParams.get("category") || "all");
    const onlyCount = req.nextUrl.searchParams.get("count") === "1";
    if (onlyCount) {
      const c = await unreadCount(user.username);
      return NextResponse.json(
        { ok: true, unread: c },
        { headers: { "Cache-Control": "private, max-age=15" } }
      );
    }
    const rows = await listInbox(user.username, cat);
    const unread = await unreadCount(user.username);
    return NextResponse.json({
      ok: true,
      items: rows.map(mapRow),
      unread,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.username) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    await ensureInboxTables();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const u = user.username.toLowerCase();

    if (action === "mark_read") {
      const id = String(body.id || "").trim();
      if (id) {
        await sql`
          UPDATE user_inbox SET is_read = TRUE
          WHERE id = ${id}::uuid AND lower(username) = ${u}
        `;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_all_read") {
      await sql`
        UPDATE user_inbox SET is_read = TRUE
        WHERE lower(username) = ${u} AND is_read = FALSE
      `;
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_handled") {
      const id = String(body.id || "").trim();
      if (id) {
        await sql`
          UPDATE user_inbox SET is_handled = TRUE, is_read = TRUE
          WHERE id = ${id}::uuid AND lower(username) = ${u}
        `;
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Action không hợp lệ" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
