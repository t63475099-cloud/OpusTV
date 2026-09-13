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
    const severity = String(body.severity || "low").slice(0, 16);
    const riskScore = Math.min(100, Math.max(0, Math.floor(Number(body.riskScore) || 0)));
    let detail = String(body.detail || "").slice(0, 800);
    const path = String(body.path || "").slice(0, 200);
    const meta =
      body.meta && typeof body.meta === "object"
        ? JSON.stringify(body.meta).slice(0, 600)
        : "";
    if (meta) {
      detail = `${detail} | meta:${meta}`.slice(0, 800);
    }
    if (severity && severity !== "low") {
      detail = `[${severity}] ${detail}`.slice(0, 800);
    }
    if (riskScore > 0) {
      detail = `${detail} | risk=${riskScore}`.slice(0, 800);
    }

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
    try {
      await db`ALTER TABLE moderation_alerts ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'low'`;
      await db`ALTER TABLE moderation_alerts ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0`;
    } catch {
      /* */
    }

    if (userId) {
      const cnt = await db`
        SELECT COUNT(*)::int AS c FROM moderation_alerts
        WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '1 hour'
      `;
      if (Number((cnt[0] as { c: number }).c) >= 12) {
        return NextResponse.json({ ok: true, throttled: true });
      }
    }

    try {
      await db`
        INSERT INTO moderation_alerts (user_id, username, kind, detail, path, ip, user_agent, severity, risk_score)
        VALUES (${userId}, ${username}, ${kind}, ${detail}, ${path}, ${ip}, ${ua}, ${severity}, ${riskScore})
      `;
    } catch {
      await db`
        INSERT INTO moderation_alerts (user_id, username, kind, detail, path, ip, user_agent)
        VALUES (${userId}, ${username}, ${kind}, ${detail}, ${path}, ${ip}, ${ua})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
