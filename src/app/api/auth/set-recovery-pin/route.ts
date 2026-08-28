import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { setRecoveryPin } from "@/lib/db/users";

/** Đặt / đổi mã khôi phục khi đã đăng nhập */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const recoveryPin = String(body.recoveryPin || "").trim();
    await setRecoveryPin(session.userId, recoveryPin);
    return NextResponse.json({ ok: true, message: "Đã lưu mã khôi phục" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
