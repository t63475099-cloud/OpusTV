import { NextRequest, NextResponse } from "next/server";
import {
  findUserByUsername,
  saveOtp,
  secondsUntilResend,
} from "@/lib/db/users";
import { generateOtp, normalizePhone } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const phone = normalizePhone(String(body.phone || ""));

    if (!username || !phone) {
      return NextResponse.json(
        { ok: false, error: "Nhập tên tài khoản và số điện thoại" },
        { status: 400 }
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    if (!user.phone || user.phone !== phone) {
      return NextResponse.json(
        { ok: false, error: "Số điện thoại không khớp tài khoản" },
        { status: 400 }
      );
    }

    const wait = secondsUntilResend(user.otpLastSent);
    if (wait > 0) {
      return NextResponse.json(
        { ok: false, error: `Gửi lại sau ${wait}s`, retryAfter: wait },
        { status: 429 }
      );
    }

    // Tạo mã 6 số, chữ số không trùng; tránh trùng mã đang còn hạn (nếu có)
    let code = generateOtp();
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateOtp();
      // unique digits already guaranteed by generateOtp
      break;
    }

    await saveOtp(user.id, code);

    return NextResponse.json({
      ok: true,
      message: "Mã OTP đã tạo",
      /** Hiện trên web — không gửi SMS */
      otp: code,
      retryAfter: 60,
      expiresIn: 300,
    });
  } catch (e: unknown) {
    console.error("send-otp", e);
    return NextResponse.json({ ok: false, error: "Lỗi máy chủ" }, { status: 500 });
  }
}
