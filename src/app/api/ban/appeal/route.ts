import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

async function ensure(db: ReturnType<typeof sql>) {
  await db`
    CREATE TABLE IF NOT EXISTS ban_appeals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      ban_level INTEGER DEFAULT 1,
      ban_reason TEXT DEFAULT '',
      ban_kind TEXT DEFAULT '',
      message TEXT NOT NULL,
      contact TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `;
}

/** Người dùng gửi đơn khiếu nại (cần session còn hiệu lực hoặc vừa bị khóa) */
export async function POST(req: NextRequest) {
  try {
    const u = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, 2000);
    const contact = String(body.contact || "").trim().slice(0, 120);
    const username = String(body.username || u?.username || "")
      .trim()
      .toLowerCase()
      .slice(0, 64);

    if (!message || message.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Nội dung khiếu nại tối thiểu 10 ký tự" },
        { status: 400 }
      );
    }
    if (!u && !username) {
      return NextResponse.json(
        { ok: false, error: "Cần đăng nhập hoặc ghi rõ tên tài khoản" },
        { status: 401 }
      );
    }

    const db = sql();
    await ensure(db);

    let userId = u?.userId || 0;
    let uname = u?.username || username;

    // Lấy ban mới nhất
    let banLevel = 1;
    let banReason = "";
    let banKind = "";
    if (userId) {
      const bans = await db`
        SELECT level, reason, kind FROM user_bans
        WHERE user_id = ${userId}
        ORDER BY id DESC LIMIT 1
      `;
      if (bans.length) {
        banLevel = Number((bans[0] as { level: number }).level) || 1;
        banReason = String((bans[0] as { reason: string }).reason || "");
        banKind = String((bans[0] as { kind: string }).kind || "");
      }
    } else if (username) {
      const bans = await db`
        SELECT user_id, username, level, reason, kind FROM user_bans
        WHERE lower(username) = ${username}
        ORDER BY id DESC LIMIT 1
      `;
      if (bans.length) {
        const b = bans[0] as {
          user_id: number;
          username: string;
          level: number;
          reason: string;
          kind: string;
        };
        userId = b.user_id;
        uname = b.username;
        banLevel = Number(b.level) || 1;
        banReason = String(b.reason || "");
        banKind = String(b.kind || "");
      }
    }

    // Chống spam: 1 đơn pending / user
    if (userId) {
      const pending = await db`
        SELECT id FROM ban_appeals
        WHERE user_id = ${userId} AND status = 'pending'
        LIMIT 1
      `;
      if (pending.length) {
        return NextResponse.json({
          ok: true,
          already: true,
          message: "Bạn đã có đơn đang chờ duyệt",
        });
      }
    }

    await db`
      INSERT INTO ban_appeals (
        user_id, username, ban_level, ban_reason, ban_kind, message, contact, status
      ) VALUES (
        ${userId}, ${uname}, ${banLevel}, ${banReason}, ${banKind},
        ${message}, ${contact}, 'pending'
      )
    `;

    return NextResponse.json({ ok: true, message: "Đã gửi đơn khiếu nại. Admin sẽ xem xét." });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Admin list / resolve — dùng x-admin-secret */
export async function GET(req: NextRequest) {
  const secret =
    process.env.VERIFY_ADMIN_SECRET ||
    process.env.MIGRATE_SECRET ||
    "OpusFilm2026Secret";
  if ((req.headers.get("x-admin-secret") || "") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    await ensure(db);
    const rows = await db`
      SELECT * FROM ban_appeals
      ORDER BY
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, appeals: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const secret =
    process.env.VERIFY_ADMIN_SECRET ||
    process.env.MIGRATE_SECRET ||
    "OpusFilm2026Secret";
  if ((req.headers.get("x-admin-secret") || "") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const id = Number(body.id);
    const status = String(body.status || "").toLowerCase(); // approved | rejected
    const note = String(body.note || "").slice(0, 500);
    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Thiếu id/status" }, { status: 400 });
    }
    const db = sql();
    await ensure(db);

    const rows = await db`SELECT * FROM ban_appeals WHERE id = ${id} LIMIT 1`;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy đơn" }, { status: 404 });
    }
    const row = rows[0] as { user_id: number; username: string };

    await db`
      UPDATE ban_appeals
      SET status = ${status}, admin_note = ${note}, resolved_at = NOW()
      WHERE id = ${id}
    `;

    // Duyệt → gỡ khóa
    if (status === "approved" && row.user_id) {
      await db`DELETE FROM user_bans WHERE user_id = ${row.user_id}`;
    }

    return NextResponse.json({ ok: true, status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
