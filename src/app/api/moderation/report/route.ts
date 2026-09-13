import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || "other").slice(0, 40);
    const detail = String(body.detail || "").slice(0, 800);
    const path = String(body.path || "").slice(0, 200);
    if (!detail && !kind) {
      return NextResponse.json({ ok: false, error: "Thiếu dữ liệu" }, { status: 400 });
    }
    let userId: number | null = null;
    let username = "";
    try {
      const u = await getSessionUser();
      if (u) {
        userId = u.userId;
        username = u.username;
      }
    } catch {
      /* guest */
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const ua = (req.headers.get("user-agent") || "").slice(0, 300);
    const db = sql();
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
    // rate limit simple: max 5 open alerts / user / hour
    if (userId) {
      const cnt = await db`
        SELECT COUNT(*)::int AS c FROM moderation_alerts
        WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '1 hour'
      `;
      if (Number((cnt[0] as { c: number }).c) >= 8) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }
    await db`
      INSERT INTO moderation_alerts (user_id, username, kind, detail, path, ip, user_agent)
      VALUES (${userId}, ${username}, ${kind}, ${detail}, ${path}, ${ip}, ${ua})
    `;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
