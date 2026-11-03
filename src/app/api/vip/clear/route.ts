import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function confirmOk(raw: string): boolean {
  const c = raw.trim().toUpperCase().replace(/\s+/g, "");
  return c === "CONFIRM" || c === "XOA" || c === "DELETE" || c === "XOAGOI" || c === "XÓA";
}

/** User self-clear VIP (Cài đặt) — UI gõ CONFIRM */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const confirm = String(body?.confirm || "");
    if (!username) {
      return NextResponse.json({ ok: false, error: "Thiếu tài khoản" }, { status: 400 });
    }
    if (!confirmOk(confirm)) {
      return NextResponse.json(
        { ok: false, error: "Gõ CONFIRM để xác nhận xóa gói VIP" },
        { status: 400 },
      );
    }
    await ensureVipTables();

    // Xóa mọi mốc VIP có thể dùng trên hệ thống
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
          SET is_lifetime_vip = FALSE, vip_expires_at = NULL, expires_at = NULL
          WHERE lower(username) = ${username}
        `;
      } catch {
        try {
          await sql`UPDATE users SET expires_at = NULL WHERE lower(username) = ${username}`;
        } catch {
          await sql`
            UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = NULL
            WHERE lower(username) = ${username}
          `;
        }
      }
    }

    try {
      await sql`
        UPDATE users
        SET active_key_code = NULL, key_expires_at = NULL
        WHERE lower(username) = ${username}
      `;
    } catch {
      /* optional */
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
