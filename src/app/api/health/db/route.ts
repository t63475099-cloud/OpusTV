import { NextResponse } from "next/server";
import { wakeNeon, formatDbError, resolveDatabaseUrl } from "@/lib/neonSql";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/health/db — đánh thức Neon + kiểm tra kết nối */
export async function GET() {
  const hasUrl = !!resolveDatabaseUrl();
  if (!hasUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL chưa có trên server",
        hint: "Render → Environment → DATABASE_URL = Neon connection string (?sslmode=require)",
      },
      { status: 503 }
    );
  }
  const r = await wakeNeon();
  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: r.error || "Neon unreachable" },
      { status: 500 }
    );
  }
  let host = "unknown";
  try {
    const u = new URL(resolveDatabaseUrl()!.replace(/^postgresql:/, "postgres:"));
    host = u.hostname;
  } catch {
    /* */
  }
  return NextResponse.json({ ok: true, db: "connected", host });
}
