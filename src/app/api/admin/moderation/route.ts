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
  return (req.headers.get("x-admin-secret") || "") === secret;
}

async function ensure(db: ReturnType<typeof sql>) {
  await db`
    CREATE TABLE IF NOT EXISTS moderation_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT DEFAULT '',
      kind TEXT NOT NULL DEFAULT 'other',
      detail TEXT DEFAULT '',
      path TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS user_bans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      reason TEXT DEFAULT '',
      kind TEXT DEFAULT 'other',
      ban_until TIMESTAMPTZ,
      permanent BOOLEAN DEFAULT FALSE,
      ip_block TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by TEXT DEFAULT 'admin'
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS user_warnings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      last_reason TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    await ensure(db);
    const alerts = await db`
      SELECT * FROM moderation_alerts
      WHERE status = 'open'
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const bans = await db`
      SELECT * FROM user_bans
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ ok: true, alerts, bans });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST:
 * - warn: { action, username, reason }
 * - ban: { action, username, level, reason, kind, ip? }
 * - close_alert: { action, id }
 * - unban: { action, username }
 */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const db = sql();
    await ensure(db);

    if (action === "close_alert") {
      const id = Number(body.id || 0);
      if (!id) return NextResponse.json({ ok: false, error: "Thiếu id" }, { status: 400 });
      await db`UPDATE moderation_alerts SET status = 'closed' WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    const username = String(body.username || "")
      .trim()
      .toLowerCase()
      .slice(0, 64);
    if (!username && action !== "close_alert") {
      return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
    }

    const users = username
      ? await db`SELECT id, username FROM users WHERE lower(username) = ${username} LIMIT 1`
      : [];
    if (username && !users.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    const u = users[0] as { id: number; username: string } | undefined;

    if (action === "warn" && u) {
      const reason = String(body.reason || "").slice(0, 400);
      const rows = await db`SELECT id, count FROM user_warnings WHERE user_id = ${u.id} LIMIT 1`;
      let count = 1;
      if (rows.length) {
        count = Number((rows[0] as { count: number }).count || 0) + 1;
        await db`
          UPDATE user_warnings SET count = ${count}, last_reason = ${reason}, updated_at = NOW()
          WHERE user_id = ${u.id}
        `;
      } else {
        await db`
          INSERT INTO user_warnings (user_id, username, count, last_reason)
          VALUES (${u.id}, ${u.username}, 1, ${reason})
        `;
      }
      return NextResponse.json({ ok: true, warnings: count });
    }

    if (action === "ban" && u) {
      const level = Math.min(5, Math.max(1, Math.floor(Number(body.level) || 1)));
      const reason = String(body.reason || "").slice(0, 500);
      const kind = String(body.kind || "other").slice(0, 40);
      const ip = String(body.ip || "").slice(0, 64);
      const daysMap: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 30, 5: 0 };
      const days = daysMap[level] ?? 1;
      const permanent = level >= 5;
      let banUntil: string | null = null;
      if (!permanent) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        banUntil = d.toISOString();
      }
      await db`
        INSERT INTO user_bans (user_id, username, level, reason, kind, ban_until, permanent, ip_block)
        VALUES (${u.id}, ${u.username}, ${level}, ${reason}, ${kind}, ${banUntil}, ${permanent}, ${ip})
      `;
      return NextResponse.json({
        ok: true,
        level,
        permanent,
        banUntil,
      });
    }

    if (action === "unban" && u) {
      await db`DELETE FROM user_bans WHERE user_id = ${u.id}`;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "action không hợp lệ" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
