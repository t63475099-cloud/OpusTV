import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { getVipTier, stackVipExpiry } from "@/lib/vipCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const tierCode = String(body?.tierCode || "").trim().toUpperCase();
    const tier = getVipTier(tierCode);
    if (!username || !tier) {
      return NextResponse.json({ ok: false, error: "Thiếu username hoặc tier không hợp lệ" }, { status: 400 });
    }
    await ensureVipTables();
    const rows = (await sql`
      SELECT id, coins, vip_expires_at::text, is_lifetime_vip
      FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    const u = rows[0];
    const coins = Number(u.coins || 0);
    if (coins < tier.coinPrice) {
      return NextResponse.json({
        ok: false,
        error: `Không đủ xu (cần ${tier.coinPrice}, hiện có ${coins})`,
      }, { status: 400 });
    }
    if (u.is_lifetime_vip && tier.isLifetime) {
      return NextResponse.json({ ok: false, error: "Tài khoản đã có VIP vĩnh viễn" }, { status: 400 });
    }
    const curExp = u.vip_expires_at ? Date.parse(String(u.vip_expires_at)) : null;
    const stacked = stackVipExpiry(
      Number.isFinite(curExp as number) ? (curExp as number) : null,
      tier
    );
    const newCoins = coins - tier.coinPrice;
    if (stacked.isLifetime) {
      await sql`
        UPDATE users SET coins = ${newCoins}, is_lifetime_vip = TRUE, vip_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
    } else {
      const iso = new Date(stacked.expiresAtMs!).toISOString();
      await sql`
        UPDATE users SET coins = ${newCoins}, is_lifetime_vip = FALSE, vip_expires_at = ${iso}::timestamptz
        WHERE lower(username) = ${username}
      `;
    }
    await sql`
      INSERT INTO coin_transactions (user_id, amount, reason, meta)
      VALUES (${username}, ${-tier.coinPrice}, 'buy_vip', ${JSON.stringify({ tier: tier.code })}::jsonb)
    `;
    return NextResponse.json({
      ok: true,
      message: `Đã kích hoạt ${tier.label}`,
      coins: newCoins,
      isLifetime: stacked.isLifetime,
      vipExpiresAt: stacked.isLifetime ? null : new Date(stacked.expiresAtMs!).toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi mua VIP";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
