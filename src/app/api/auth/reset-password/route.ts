import { NextRequest, NextResponse } from "next/server";
import {
  findUserByUsername,
  resetPasswordByUserId,
  verifyAndConsumeOtp,
} from "@/lib/db/users";
import { normalizePhone } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const phone = normalizePhone(String(body.phone || ""));
    const otp = String(body.otp || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!username || !phone || !otp || !newPassword) {
      return NextResponse.json({ ok: false, error: "Thiếu thông tin" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ ok: false, error: "Mã OTP 6 số" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ ok: false, error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });
    }

    const user = await findUserByUsername(username);
    if (!user || user.phone !== phone) {
      return NextResponse.json({ ok: false, error: "Tài khoản hoặc SĐT không đúng" }, { status: 400 });
    }

    const ok = await verifyAndConsumeOtp(user.id, otp);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "OTP sai hoặc đã hết hạn" }, { status: 400 });
    }

    await resetPasswordByUserId(user.id, newPassword);
    return NextResponse.json({
      ok: true,
      message: "Đã đặt lại mật khẩu. Hãy đăng nhập.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
