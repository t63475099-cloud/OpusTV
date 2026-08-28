import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByUsername } from "@/lib/db/users";
import { createSession, cookieOptions, SESSION_COOKIE } from "@/lib/session";

function cleanUsername(s: string) {
  return s.trim().toLowerCase().slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình." }, { status: 503 });
    }
    const body = await req.json();
    const username = cleanUsername(String(body.username || ""));
    const password = String(body.password || "");
    const recoveryPin = String(body.recoveryPin || body.pin || "").trim();

    if (username.length < 3) {
      return NextResponse.json({ ok: false, error: "Tên tài khoản tối thiểu 3 ký tự" }, { status: 400 });
    }
    if (!/^[a-z0-9._]+$/.test(username)) {
      return NextResponse.json({ ok: false, error: "Chỉ dùng a-z, 0-9, . và _" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });
    }
    if (!/^\d{4,8}$/.test(recoveryPin)) {
      return NextResponse.json({ ok: false, error: "Mã PIN: 4–8 chữ số" }, { status: 400 });
    }
    if (await findUserByUsername(username)) {
      return NextResponse.json({ ok: false, error: "Tên tài khoản đã tồn tại" }, { status: 409 });
    }

    const user = await createUser(username, password, recoveryPin);
    const token = await createSession(user.id);
    const res = NextResponse.json({ ok: true, username: user.username, storage: "neon" });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(30 * 24 * 60 * 60));
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi đăng ký";
    console.error("register", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
