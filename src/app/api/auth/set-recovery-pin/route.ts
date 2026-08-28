import { NextResponse } from "next/server";

/** Đã ngừng dùng mã PIN — dùng OTP trên web */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Tính năng mã khôi phục đã tắt. Dùng Quên mật khẩu + OTP." },
    { status: 410 }
  );
}
