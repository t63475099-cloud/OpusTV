import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { isVipActive } from "@/lib/vipCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const username = (req.nextUrl.searchParams.get("username") || "").trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ ok: true, hasVip: false, isLifetime: false, vipExpiresAt: null, coins: 0 });
  }
  try {
    await ensureVipTables();
    const rows = (await sql`
      SELECT coins, vip_expires_at::text, is_lifetime_vip
      FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!rows[0]) {
      return NextResponse.json({ ok: true, hasVip: false, isLifetime: false, vipExpiresAt: null, coins: 0 });
    }
    const r = rows[0];
    const isLifetime = Boolean(r.is_lifetime_vip);
    const vipExpiresAt = r.vip_expires_at ? String(r.vip_expires_at) : null;
    const coins = Number(r.coins || 0);
    const hasVip = isVipActive({ isLifetime, expiresAtIso: vipExpiresAt });
    return NextResponse.json({ ok: true, hasVip, isLifetime, vipExpiresAt, coins });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DB error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
