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
    const code = String(body?.code || "").trim().toUpperCase();
    if (!username || !code) {
      return NextResponse.json({ ok: false, error: "Thiếu username/code" }, { status: 400 });
    }
    await ensureVipTables();
    const rows = (await sql`
      SELECT id::text, coins, vip_tier, max_uses, used_count, is_active,
             starts_at::text, ends_at::text
      FROM giftcodes WHERE upper(code) = ${code} LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!rows[0] || !rows[0].is_active) {
      return NextResponse.json({ ok: false, error: "Giftcode không tồn tại hoặc đã khóa" }, { status: 404 });
    }
    const g = rows[0];
    const now = Date.now();
    if (g.starts_at && Date.parse(String(g.starts_at)) > now) {
      return NextResponse.json({ ok: false, error: "Giftcode chưa tới hạn dùng" }, { status: 400 });
    }
    if (g.ends_at && Date.parse(String(g.ends_at)) < now) {
      return NextResponse.json({ ok: false, error: "Giftcode đã hết hạn" }, { status: 400 });
    }
    const maxUses = g.max_uses != null ? Number(g.max_uses) : null;
    const used = Number(g.used_count || 0);
    if (maxUses != null && used >= maxUses) {
      return NextResponse.json({ ok: false, error: "Giftcode đã hết lượt" }, { status: 400 });
    }

    try {
      await sql`
        INSERT INTO giftcode_redemptions (giftcode_id, user_id)
        VALUES (${String(g.id)}::uuid, ${username})
      `;
    } catch {
      return NextResponse.json({ ok: false, error: "Bạn đã nhập giftcode này" }, { status: 409 });
    }

    await sql`
      UPDATE giftcodes SET used_count = used_count + 1 WHERE id = ${String(g.id)}::uuid
    `;

    const addCoins = Number(g.coins || 0);
    let coinsOut: number | null = null;
    let isLifetime: boolean | undefined;
    let vipExpiresAt: string | null | undefined;

    if (addCoins > 0) {
      const u = (await sql`
        UPDATE users SET coins = COALESCE(coins, 0) + ${addCoins}
        WHERE lower(username) = ${username}
        RETURNING coins
      `) as Array<{ coins: number }>;
      coinsOut = u[0]?.coins ?? null;
      await sql`
        INSERT INTO coin_transactions (user_id, amount, reason, meta)
        VALUES (${username}, ${addCoins}, 'giftcode', ${JSON.stringify({ code })}::jsonb)
      `;
    }

    const vipTier = g.vip_tier ? String(g.vip_tier) : null;
    if (vipTier) {
      const tier = getVipTier(vipTier);
      if (tier) {
        const cur = (await sql`
          SELECT vip_expires_at::text, is_lifetime_vip FROM users WHERE lower(username) = ${username} LIMIT 1
        `) as Array<Record<string, unknown>>;
        const curExp = cur[0]?.vip_expires_at ? Date.parse(String(cur[0].vip_expires_at)) : null;
        const stacked = stackVipExpiry(
          Number.isFinite(curExp as number) ? (curExp as number) : null,
          tier
        );
        isLifetime = stacked.isLifetime;
        if (stacked.isLifetime) {
          await sql`UPDATE users SET is_lifetime_vip = TRUE, vip_expires_at = NULL WHERE lower(username) = ${username}`;
          vipExpiresAt = null;
        } else {
          vipExpiresAt = new Date(stacked.expiresAtMs!).toISOString();
          await sql`
            UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = ${vipExpiresAt}::timestamptz
            WHERE lower(username) = ${username}
          `;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Giftcode đã được áp dụng",
      coins: coinsOut,
      isLifetime,
      vipExpiresAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi giftcode";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
