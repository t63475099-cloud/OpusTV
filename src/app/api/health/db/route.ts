import { NextResponse } from "next/server";
import { getNeonSql, formatDbError, resolveDatabaseUrl } from "@/lib/neonSql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Kiểm tra Neon từ Render: GET /api/health/db */
export async function GET() {
  const hasUrl = !!resolveDatabaseUrl();
  if (!hasUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL chưa có trên server",
        hint: "Render Dashboard → Environment → Add DATABASE_URL (Neon connection string)",
      },
      { status: 503 }
    );
  }
  try {
    const sql = getNeonSql();
    const rows = await sql`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: true,
      db: "connected",
      sample: rows?.[0] ?? null,
      host: (() => {
        try {
          const u = new URL(resolveDatabaseUrl()!.replace(/^postgresql:/, "postgres:"));
          return u.hostname;
        } catch {
          return "unknown";
        }
      })(),
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: formatDbError(e), raw: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
