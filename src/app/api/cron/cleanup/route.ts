import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withDbRetry, ensureSystemTables } from "@/lib/system/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup
 * Expire sessions, used keys older than 30d, trim audit logs
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || process.env.MIGRATE_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (secret && auth !== `Bearer ${secret}`) {
    const q = req.nextUrl.searchParams.get("secret");
    if (q !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "no db" }, { status: 503 });
    }
    await ensureSystemTables();
    const stats = await withDbRetry(async () => {
      const sql = neon(process.env.DATABASE_URL!);
      let sessions = 0;
      let keys = 0;
      let logs = 0;
      try {
        const r = await sql`
          DELETE FROM sessions
          WHERE expires_at < NOW() OR revoked_at IS NOT NULL
          RETURNING id
        `;
        sessions = r.length;
      } catch {
        /* */
      }
      try {
        const r = await sql`
          DELETE FROM activation_keys
          WHERE (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days')
             OR (expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '7 days')
          RETURNING id
        `;
        keys = r.length;
      } catch {
        /* */
      }
      try {
        const r = await sql`
          DELETE FROM system_audit_logs
          WHERE id NOT IN (
            SELECT id FROM system_audit_logs ORDER BY id DESC LIMIT 5000
          )
          RETURNING id
        `;
        logs = r.length;
      } catch {
        /* */
      }
      return { sessions, keys, logs };
    });
    return NextResponse.json({ ok: true, cleaned: stats, ts: Date.now() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
