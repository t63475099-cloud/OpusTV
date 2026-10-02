import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withDbRetry } from "@/lib/system/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/warmer
 * Vercel Cron every ~4 min — keep Neon warm
 * Header: Authorization: Bearer CRON_SECRET (optional)
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
    await withDbRetry(async () => {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`SELECT 1 AS ok`;
    });
    return NextResponse.json({ ok: true, warm: true, ts: Date.now() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
