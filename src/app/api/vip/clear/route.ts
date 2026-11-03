import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** User self-clear VIP package (settings) — xóa hết cờ VIP liên quan */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const confirm = String(body?.confirm || "").trim().toUpperCase();
    if (!username) {
      return NextResponse.json({ ok: false, error: "Thiếu tài khoản" }, { status: 400 });
    }
    // Chấp nhận nhiều cách xác nhận (UI có thể gõ XOA / xóa / DELETE)
    const okConfirm =
      confirm === "XOA" ||
      confirm === "DELETE" ||
      confirm === "XOA GOI" ||
      confirm === "XÓA" ||
      confirm.replace(/\s+/g, "") === "XOA";
    if (!okConfirm) {
      return NextResponse.json(
        { ok: false, error: "Gõ XOA để xác nhận xóa gói VIP" },
        { status: 400 },
      );
    }
    await ensureVipTables();

    // Xóa mọi cột VIP có thể tồn tại (không fail nếu cột thiếu)
    try {
      await sql`
        UPDATE users
        SET
          is_lifetime_vip = FALSE,
          vip_expires_at = NULL,
          expires_at = NULL,
          updated_at = NOW()
        WHERE lower(username) = ${username}
      `;
    } catch {
      try {
        await sql`
          UPDATE users
          SET is_lifetime_vip = FALSE, vip_expires_at = NULL
          WHERE lower(username) = ${username}
        `;
      } catch {
        await sql`
          UPDATE users SET expires_at = NULL WHERE lower(username) = ${username}
        `;
      }
    }

    // Gỡ key active nếu có cột
    try {
      await sql`
        UPDATE users
        SET active_key_code = NULL, key_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
    } catch {
      /* optional columns */
    }

    return NextResponse.json({
      ok: true,
      message: "Đã xóa gói VIP trên tài khoản",
      isLifetime: false,
      vipExpiresAt: null,
      expiresAt: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi xóa VIP";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
