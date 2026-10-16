import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensureVipTables } from "@/lib/vipDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** User self-clear VIP package (settings) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const confirm = String(body?.confirm || "").trim().toUpperCase();
    if (!username) {
      return NextResponse.json({ ok: false, error: "Thiếu tài khoản" }, { status: 400 });
    }
    if (confirm !== "XOA" && confirm !== "DELETE") {
      return NextResponse.json(
        { ok: false, error: "Gõ XOA để xác nhận xóa gói VIP" },
        { status: 400 }
      );
    }
    await ensureVipTables();
    await sql`
      UPDATE users
      SET is_lifetime_vip = FALSE, vip_expires_at = NULL
      WHERE lower(username) = ${username}
    `;
    return NextResponse.json({
      ok: true,
      message: "Đã xóa gói VIP trên tài khoản",
      isLifetime: false,
      vipExpiresAt: null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi xóa VIP";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
