import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { getVipTier, parseOpusKeyTier, stackVipExpiry } from "@/lib/vipCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const keyCode = String(body?.key || body?.keyCode || "").trim().toUpperCase();
    if (!username || !keyCode) {
      return NextResponse.json({ ok: false, error: "Thiếu username hoặc key" }, { status: 400 });
    }
    const tierCode = parseOpusKeyTier(keyCode);
    if (!tierCode) {
      return NextResponse.json({
        ok: false,
        error: "Định dạng key không hợp lệ (OPUS-<GÓI>-XXXXXXXX)",
      }, { status: 400 });
    }
    const tier = getVipTier(tierCode)!;
    await ensureVipTables();

    const claimed = (await sql`
      UPDATE license_keys_v2
      SET status = 'CLAIMED',
          claimed_by_user_id = ${username},
          claimed_username = ${username},
          claimed_at = NOW()
      WHERE key_code = ${keyCode}
        AND status = 'AVAILABLE'
        AND claimed_by_user_id IS NULL
      RETURNING id::text, tier_code
    `) as Array<Record<string, unknown>>;

    if (!claimed[0]) {
      const existing = (await sql`
        SELECT status, claimed_username FROM license_keys_v2 WHERE key_code = ${keyCode} LIMIT 1
      `) as Array<Record<string, unknown>>;
      if (!existing[0]) {
        return NextResponse.json({ ok: false, error: "Mã Key không tồn tại" }, { status: 404 });
      }
      if (existing[0].status === "CLAIMED") {
        return NextResponse.json({
          ok: false,
          error: "Mã Key này đã được sử dụng bởi một tài khoản khác và không thể dùng chung.",
        }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: "Mã Key không khả dụng" }, { status: 400 });
    }

    const users = (await sql`
      SELECT vip_expires_at::text, is_lifetime_vip FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!users[0]) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    const curExp = users[0].vip_expires_at ? Date.parse(String(users[0].vip_expires_at)) : null;
    const stacked = stackVipExpiry(
      Number.isFinite(curExp as number) ? (curExp as number) : null,
      tier
    );
    if (stacked.isLifetime) {
      await sql`
        UPDATE users SET is_lifetime_vip = TRUE, vip_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
    } else {
      const iso = new Date(stacked.expiresAtMs!).toISOString();
      await sql`
        UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = ${iso}::timestamptz
        WHERE lower(username) = ${username}
      `;
    }

    return NextResponse.json({
      ok: true,
      message: `Kích hoạt thành công! Đã cộng ${tier.label} VIP vào tài khoản của bạn.`,
      isLifetime: stacked.isLifetime,
      vipExpiresAt: stacked.isLifetime ? null : new Date(stacked.expiresAtMs!).toISOString(),
      tier: tier.code,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi kích hoạt key";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
