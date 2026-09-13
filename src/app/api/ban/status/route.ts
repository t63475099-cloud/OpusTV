import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

export async function GET(req: NextRequest) {
  try {
    const u = await getSessionUser();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const db = sql();
    try {
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
    } catch {
      /* */
    }

    let ban: Record<string, unknown> | null = null;
    if (u) {
      const rows = await db`
        SELECT * FROM user_bans
        WHERE user_id = ${u.userId}
        ORDER BY id DESC
        LIMIT 1
      `;
      if (rows.length) ban = rows[0] as Record<string, unknown>;
    }
    if (!ban && ip) {
      const rows = await db`
        SELECT * FROM user_bans
        WHERE permanent = true AND ip_block = ${ip} AND ip_block <> ''
        ORDER BY id DESC
        LIMIT 1
      `;
      if (rows.length) ban = rows[0] as Record<string, unknown>;
    }

    if (!ban) {
      return NextResponse.json({ ok: true, banned: false });
    }

    const permanent = !!ban.permanent;
    const until = ban.ban_until ? new Date(String(ban.ban_until)) : null;
    if (!permanent && until && until.getTime() < Date.now()) {
      return NextResponse.json({ ok: true, banned: false, expired: true });
    }

    return NextResponse.json({
      ok: true,
      banned: true,
      level: Number(ban.level) || 1,
      permanent,
      banUntil: until ? until.toISOString() : null,
      reason: String(ban.reason || ""),
      kind: String(ban.kind || ""),
      username: String(ban.username || ""),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg, banned: false }, { status: 200 });
  }
}
