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
      SELECT id::text, code, coins_reward, vip_hours, vip_tier_key, max_claims, current_claims,
             is_active, starts_at::text, expires_at::text
      FROM system_giftcodes
      WHERE upper(trim(code)) = ${code}
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Giftcode không tồn tại" }, { status: 404 });
    }
    const g = rows[0];
    if (!g.is_active) {
      return NextResponse.json({ ok: false, error: "Giftcode đã bị khóa" }, { status: 400 });
    }
    const now = Date.now();
    if (g.starts_at && Date.parse(String(g.starts_at)) > now) {
      return NextResponse.json({ ok: false, error: "Giftcode chưa tới hạn dùng" }, { status: 400 });
    }
    if (g.expires_at && Date.parse(String(g.expires_at)) < now) {
      return NextResponse.json({ ok: false, error: "Giftcode đã hết hạn" }, { status: 400 });
    }
    const maxClaims = Number(g.max_claims ?? 1);
    const current = Number(g.current_claims || 0);
    if (current >= maxClaims) {
      return NextResponse.json({ ok: false, error: "Giftcode đã hết lượt" }, { status: 400 });
    }

    try {
      await sql`
        INSERT INTO giftcode_redemptions (giftcode_id, code, user_id)
        VALUES (${String(g.id)}::uuid, ${code}, ${username})
      `;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/unique|duplicate/i.test(msg)) {
        return NextResponse.json(
          { ok: false, error: "Bạn đã nhập giftcode này" },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    await sql`
      UPDATE system_giftcodes
      SET current_claims = COALESCE(current_claims, 0) + 1
      WHERE id = ${String(g.id)}::uuid
    `;

    const coinsReward = Number(g.coins_reward || 0);
    const vipHours = Number(g.vip_hours || 0);
    const vipTierKey = g.vip_tier_key ? String(g.vip_tier_key) : null;

    let coinsOut: number | null = null;
    let isLifetime: boolean | undefined;
    let vipExpiresAt: string | null | undefined;
    const granted: string[] = [];

    if (coinsReward > 0) {
      const u = (await sql`
        UPDATE users SET coins = COALESCE(coins, 0) + ${coinsReward}
        WHERE lower(username) = ${username}
        RETURNING coins
      `) as Array<{ coins: number }>;
      coinsOut = u[0]?.coins ?? null;
      granted.push(`+${coinsReward} Xu`);
      await sql`
        INSERT INTO coin_transactions (user_id, amount, reason, meta)
        VALUES (${username}, ${coinsReward}, 'giftcode', ${JSON.stringify({ code })}::jsonb)
      `;
    }

    const cur = (await sql`
      SELECT vip_expires_at::text, is_lifetime_vip FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;
    let curExpMs =
      cur[0]?.vip_expires_at && Number.isFinite(Date.parse(String(cur[0].vip_expires_at)))
        ? Date.parse(String(cur[0].vip_expires_at))
        : null;
    let lifetime = Boolean(cur[0]?.is_lifetime_vip);

    if (vipHours > 0 && !lifetime) {
      const base = Math.max(Date.now(), curExpMs || 0);
      curExpMs = base + vipHours * 3600 * 1000;
      granted.push(`+${vipHours} giờ VIP`);
    }

    if (vipTierKey) {
      const tier = getVipTier(vipTierKey);
      if (tier) {
        if (tier.isLifetime) {
          lifetime = true;
          curExpMs = null;
          granted.push(tier.label);
        } else if (!lifetime) {
          const stacked = stackVipExpiry(curExpMs, tier);
          curExpMs = stacked.expiresAtMs;
          granted.push(tier.label);
        }
      }
    }

    if (lifetime) {
      await sql`
        UPDATE users SET is_lifetime_vip = TRUE, vip_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
      isLifetime = true;
      vipExpiresAt = null;
    } else if (curExpMs != null) {
      vipExpiresAt = new Date(curExpMs).toISOString();
      await sql`
        UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = ${vipExpiresAt}::timestamptz
        WHERE lower(username) = ${username}
      `;
      isLifetime = false;
    }

    return NextResponse.json({
      ok: true,
      message: granted.length
        ? `Đã nhận: ${granted.join(", ")}`
        : "Giftcode đã được áp dụng",
      coins: coinsOut,
      isLifetime,
      vipExpiresAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi giftcode";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
