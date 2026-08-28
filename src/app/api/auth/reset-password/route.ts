import { NextRequest, NextResponse } from "next/server";
import { resetPasswordWithPin } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const recoveryPin = String(body.recoveryPin || body.pin || "").trim();
    const newPassword = String(body.newPassword || "");

    if (!username || !recoveryPin || !newPassword) {
      return NextResponse.json({ ok: false, error: "Thiếu thông tin" }, { status: 400 });
    }
    const result = await resetPasswordWithPin(username, recoveryPin, newPassword);
    return NextResponse.json({
      ok: true,
      username: result.username,
      message: "Đã đặt lại mật khẩu.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Không đặt lại được";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
