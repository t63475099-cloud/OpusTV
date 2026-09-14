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

/**
 * Danh sách toàn bộ tài khoản + UID.
 * Hỗ trợ ?q= để lọc username/uid và ?since=ISO để biết có user mới.
 */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    try {
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
    } catch {
      /* */
    }

    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const since = req.nextUrl.searchParams.get("since");

    let rows: Record<string, unknown>[];

    if (q) {
      const like = `%${q}%`;
      rows = (await db`
        SELECT
          id,
          username,
          uid,
          verified,
          created_at,
          last_login,
          updated_at
        FROM users
        WHERE lower(username) LIKE ${like}
           OR (uid IS NOT NULL AND uid LIKE ${like})
        ORDER BY created_at DESC
        LIMIT 500
      `) as Record<string, unknown>[];
    } else {
      rows = (await db`
        SELECT
          id,
          username,
          uid,
          verified,
          created_at,
          last_login,
          updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 500
      `) as Record<string, unknown>[];
    }

    let newCount = 0;
    if (since) {
      try {
        const sinceDate = new Date(since);
        if (!Number.isNaN(sinceDate.getTime())) {
          const c = await db`
            SELECT COUNT(*)::int AS c FROM users
            WHERE created_at > ${sinceDate.toISOString()}
          `;
          newCount = Number((c[0] as { c: number })?.c || 0);
        }
      } catch {
        /* */
      }
    }

    const total = await db`SELECT COUNT(*)::int AS c FROM users`;
    const totalCount = Number((total[0] as { c: number })?.c || rows.length);

    return NextResponse.json({
      ok: true,
      users: rows,
      total: totalCount,
      newCount,
      serverTime: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
