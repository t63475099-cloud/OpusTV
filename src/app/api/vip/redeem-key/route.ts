import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";
import { getVipTier, parseOpusKeyTier } from "@/lib/vipCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nhập key: VIP user nhận đúng expires_at đã khóa lúc Admin tạo key.
 * Không cộng duration từ lúc nhập.
 */
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
      return NextResponse.json(
        {
          ok: false,
          error: "Định dạng key không hợp lệ (OPUS-<GÓI>-XXXXXXXX)",
        },
        { status: 400 }
      );
    }
    const tier = getVipTier(tierCode)!;
    await ensureVipTables();

    const existing = (await sql`
      SELECT status, claimed_username, expires_at::text, is_lifetime, tier_code
      FROM license_keys_v2
      WHERE key_code = ${keyCode}
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (!existing[0]) {
      return NextResponse.json({ ok: false, error: "Mã Key không tồn tại" }, { status: 404 });
    }

    const row = existing[0];
    const isLifetime = !!row.is_lifetime || tier.isLifetime;
    const keyExpIso = row.expires_at ? String(row.expires_at) : null;
    const keyExpMs = keyExpIso ? Date.parse(keyExpIso) : null;

    if (!isLifetime && keyExpMs != null && Number.isFinite(keyExpMs) && keyExpMs <= Date.now()) {
      // Đánh dấu hết hạn
      await sql`
        UPDATE license_keys_v2 SET status = 'EXPIRED'
        WHERE key_code = ${keyCode} AND status = 'AVAILABLE'
      `;
      return NextResponse.json(
        { ok: false, error: "Key đã hết hạn (thời hạn tính từ lúc Admin tạo)" },
        { status: 410 }
      );
    }

    if (String(row.status) === "CLAIMED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Mã Key này đã được sử dụng bởi một tài khoản khác và không thể dùng chung.",
        },
        { status: 409 }
      );
    }
    if (String(row.status) === "EXPIRED" || String(row.status) === "REVOKED") {
      return NextResponse.json({ ok: false, error: "Mã Key không khả dụng" }, { status: 400 });
    }

    const claimed = (await sql`
      UPDATE license_keys_v2
      SET status = 'CLAIMED',
          claimed_by_user_id = ${username},
          claimed_username = ${username},
          claimed_at = NOW()
      WHERE key_code = ${keyCode}
        AND status = 'AVAILABLE'
        AND claimed_by_user_id IS NULL
      RETURNING id::text, tier_code, expires_at::text, is_lifetime
    `) as Array<Record<string, unknown>>;

    if (!claimed[0]) {
      return NextResponse.json({ ok: false, error: "Mã Key không khả dụng" }, { status: 400 });
    }

    const users = (await sql`
      SELECT vip_expires_at::text, is_lifetime_vip FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!users[0]) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    const claimIsLife = !!claimed[0].is_lifetime || isLifetime;
    const claimExp = claimed[0].expires_at ? String(claimed[0].expires_at) : keyExpIso;

    if (claimIsLife) {
      await sql`
        UPDATE users SET is_lifetime_vip = TRUE, vip_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
      return NextResponse.json({
        ok: true,
        message: "Kích hoạt thành công. Gói vĩnh viễn.",
        isLifetime: true,
        vipExpiresAt: null,
        keyExpiresAt: null,
        tier: tier.code,
      });
    }

    if (!claimExp) {
      return NextResponse.json(
        { ok: false, error: "Key thiếu mốc hết hạn — liên hệ admin" },
        { status: 500 }
      );
    }

    // VIP user = đúng expires_at của key (không cộng thêm từ NOW)
    // Nếu user đã có VIP dài hơn key → giữ mốc dài hơn (max)
    const curExp = users[0].vip_expires_at ? Date.parse(String(users[0].vip_expires_at)) : null;
    const keyMs = Date.parse(claimExp);
    const finalMs =
      users[0].is_lifetime_vip
        ? null
        : Number.isFinite(curExp as number)
          ? Math.max(curExp as number, keyMs)
          : keyMs;

    if (users[0].is_lifetime_vip) {
      // đã vĩnh viễn — key claimed nhưng VIP không đổi
      return NextResponse.json({
        ok: true,
        message: "Tài khoản đang VIP vĩnh viễn. Key đã ghi nhận.",
        isLifetime: true,
        vipExpiresAt: null,
        keyExpiresAt: claimExp,
        tier: tier.code,
      });
    }

    const iso = new Date(finalMs!).toISOString();
    await sql`
      UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = ${iso}::timestamptz
      WHERE lower(username) = ${username}
    `;

    return NextResponse.json({
      ok: true,
      message: "Kích hoạt thành công. Thời hạn theo mốc key lúc Admin tạo.",
      isLifetime: false,
      vipExpiresAt: iso,
      keyExpiresAt: claimExp,
      remainingMs: Math.max(0, keyMs - Date.now()),
      tier: tier.code,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi kích hoạt key";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
