import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "OTP đã tắt. Dùng mã PIN khôi phục." },
    { status: 410 }
  );
}
