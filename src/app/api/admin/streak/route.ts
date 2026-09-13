import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

function checkSecret(req: NextRequest) {
  const secret =
    process.env.VERIFY_ADMIN_SECRET ||
    process.env.MIGRATE_SECRET ||
    "OpusFilm2026Secret";
  const h = req.headers.get("x-admin-secret") || "";
  return h === secret;
}

async function ensureTables(db: ReturnType<typeof sql>) {
  await db`
    CREATE TABLE IF NOT EXISTS streak_restore_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      days INTEGER NOT NULL DEFAULT 1,
      reason TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS streak_grants (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      days INTEGER NOT NULL,
      source_request_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/** GET: danh sách khiếu nại chuỗi pending + grant gần đây */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    await ensureTables(db);
    const pending = await db`
      SELECT id, user_id, username, days, reason, status, created_at
      FROM streak_restore_requests
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 100
    `;
    const recent = await db`
      SELECT id, user_id, username, days, source_request_id, created_at
      FROM streak_grants
      ORDER BY created_at DESC
      LIMIT 30
    `;
    return NextResponse.json({ ok: true, pending, recent });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST actions:
 * - grant: { action: "grant", username, days } — cấp trực tiếp
 * - approve: { action: "approve", id, days? } — duyệt đơn
 * - reject: { action: "reject", id }
 */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const db = sql();
    await ensureTables(db);

    if (action === "grant") {
      const username = String(body.username || "")
        .trim()
        .toLowerCase()
        .slice(0, 64);
      const days = Math.floor(Number(body.days) || 0);
      if (!username || days < 1 || days > 999999) {
        return NextResponse.json(
          { ok: false, error: "username và days (1–999999) bắt buộc" },
          { status: 400 }
        );
      }
      const users = await db`
        SELECT id, username FROM users WHERE lower(username) = ${username} LIMIT 1
      `;
      if (!users.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      const u = users[0] as { id: number; username: string };
      const ins = await db`
        INSERT INTO streak_grants (user_id, username, days, source_request_id)
        VALUES (${u.id}, ${u.username}, ${days}, NULL)
        RETURNING id, user_id, username, days, created_at
      `;
      return NextResponse.json({ ok: true, grant: ins[0] });
    }

    if (action === "approve" || action === "reject") {
      const id = Number(body.id || 0);
      if (!id) {
        return NextResponse.json({ ok: false, error: "Thiếu id" }, { status: 400 });
      }
      const rows = await db`
        SELECT * FROM streak_restore_requests WHERE id = ${id} LIMIT 1
      `;
      if (!rows.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy đơn" }, { status: 404 });
      }
      const row = rows[0] as {
        id: number;
        user_id: number;
        username: string;
        days: number;
        status: string;
      };
      if (row.status !== "pending") {
        return NextResponse.json({ ok: false, error: "Đơn đã xử lý" }, { status: 400 });
      }

      if (action === "reject") {
        await db`
          UPDATE streak_restore_requests
          SET status = 'rejected', updated_at = NOW()
          WHERE id = ${id}
        `;
        return NextResponse.json({ ok: true, status: "rejected" });
      }

      const days = Math.floor(Number(body.days) || row.days || 1);
      if (days < 1 || days > 999999) {
        return NextResponse.json({ ok: false, error: "days không hợp lệ" }, { status: 400 });
      }
      await db`
        UPDATE streak_restore_requests
        SET status = 'approved', days = ${days}, updated_at = NOW()
        WHERE id = ${id}
      `;
      const ins = await db`
        INSERT INTO streak_grants (user_id, username, days, source_request_id)
        VALUES (${row.user_id}, ${row.username}, ${days}, ${id})
        RETURNING id, user_id, username, days, created_at
      `;
      return NextResponse.json({ ok: true, status: "approved", grant: ins[0] });
    }

    return NextResponse.json({ ok: false, error: "action không hợp lệ" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
