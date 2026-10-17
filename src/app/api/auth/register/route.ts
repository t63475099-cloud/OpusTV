import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createUser, findUserByUsername, generateUid } from "@/lib/db/users";
import { createSession, cookieOptions, SESSION_COOKIE } from "@/lib/session";
import { consumeKey, validateKey, ensureKeysTable } from "@/lib/db/keys";
import { hashPassword } from "@/lib/password";
import { normalizeKeyCode } from "@/lib/keyEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanUsername(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 32);
}

async function ensureUsersTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login TIMESTAMPTZ
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_username_uidx ON users (username)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_pin_hash TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_vip BOOLEAN DEFAULT FALSE`;
}

async function createUserNeon(
  username: string,
  password: string,
  recoveryPin: string
): Promise<{ id: number; username: string; uid: string | null }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  const sql = neon(url);
  await ensureUsersTable(sql);

  const passwordHash = await hashPassword(password);
  const recoveryPinHash = await hashPassword(recoveryPin);
  let uid = generateUid();
  for (let i = 0; i < 8; i++) {
    const hit = await sql`SELECT id FROM users WHERE uid = ${uid} LIMIT 1`;
    if (!hit.length) break;
    uid = generateUid();
  }

  const rows = await sql`
    INSERT INTO users (username, password_hash, recovery_pin_hash, uid, verified, updated_at)
    VALUES (${username}, ${passwordHash}, ${recoveryPinHash}, ${uid}, 0, NOW())
    RETURNING id, username, uid
  `;
  if (!rows.length) throw new Error("Không tạo được tài khoản");
  const r = rows[0] as { id: number; username: string; uid: string | null };
  return {
    id: Number(r.id),
    username: String(r.username),
    uid: r.uid ? String(r.uid) : null,
  };
}

/** Health check — tránh nhầm 404 khi route chưa deploy */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/auth/register",
    method: "POST",
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DATABASE_URL chưa cấu hình. Cập nhật biến môi trường trên Vercel rồi redeploy.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username = cleanUsername(String(body.username || ""));
    const password = String(body.password || "");
    const recoveryPin = String(body.recoveryPin || body.pin || "").trim();
    const rawKey = String(
      body.activationKey || body.key || body.inviteCode || body.inviteKey || ""
    ).trim();
    const activationKey = rawKey ? normalizeKeyCode(rawKey) : "";

    if (username.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Tên tài khoản tối thiểu 3 ký tự (a-z, 0-9, . _)" },
        { status: 400 }
      );
    }
    if (!/^[a-z0-9._]+$/.test(username)) {
      return NextResponse.json(
        { ok: false, error: "Chỉ dùng a-z, 0-9, dấu chấm và gạch dưới" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Mật khẩu tối thiểu 8 ký tự" },
        { status: 400 }
      );
    }
    if (!/^\d{4,8}$/.test(recoveryPin)) {
      return NextResponse.json(
        { ok: false, error: "PIN khôi phục: 4–8 chữ số" },
        { status: 400 }
      );
    }

    // Key tùy chọn: có thì kiểm tra + consume; không có vẫn cho đăng ký
    if (activationKey) {
      try {
        await ensureKeysTable();
        const keyCheck = await validateKey(activationKey);
        if (!keyCheck.ok) {
          return NextResponse.json(
            { ok: false, error: keyCheck.error || "Mã kích hoạt không hợp lệ" },
            { status: 400 }
          );
        }
      } catch (e) {
        console.error("register validateKey", e);
        return NextResponse.json(
          { ok: false, error: "Không kiểm tra được mã kích hoạt. Thử lại sau." },
          { status: 503 }
        );
      }
    }

    let existing: unknown = null;
    try {
      existing = await findUserByUsername(username);
    } catch {
      existing = null;
    }
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Tên tài khoản đã tồn tại" },
        { status: 409 }
      );
    }

    let user: { id: number; username: string; uid?: string | null };
    try {
      user = await createUser(username, password, recoveryPin);
      if (!user?.id) throw new Error("createUser empty");
    } catch (e1) {
      console.error("register createUser drizzle", e1);
      try {
        user = await createUserNeon(username, password, recoveryPin);
      } catch (e2) {
        console.error("register createUser neon", e2);
        const msg = e2 instanceof Error ? e2.message : "Không tạo được tài khoản";
        if (/unique|duplicate|already exists/i.test(msg)) {
          return NextResponse.json(
            { ok: false, error: "Tên tài khoản đã tồn tại" },
            { status: 409 }
          );
        }
        if (/quota|exceeded|402/i.test(msg)) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "CSDL đang hết hạn mức. Liên hệ quản trị viên hoặc thử lại sau.",
            },
            { status: 503 }
          );
        }
        return NextResponse.json(
          { ok: false, error: "Không tạo được tài khoản. Thử lại sau." },
          { status: 500 }
        );
      }
    }

    if (activationKey) {
      const used = await consumeKey(activationKey, username);
      if (!used.ok) {
        try {
          const sql = neon(process.env.DATABASE_URL!);
          await sql`DELETE FROM users WHERE id = ${user.id}`;
        } catch {
          /* */
        }
        return NextResponse.json(
          { ok: false, error: used.error || "Mã đã được dùng hoặc hết hạn" },
          { status: 400 }
        );
      }
    }

    const device = {
      deviceName: String(
        body.deviceName || body.device?.deviceName || ""
      ).slice(0, 120),
      userAgent: String(
        body.userAgent ||
          body.device?.userAgent ||
          req.headers.get("user-agent") ||
          ""
      ).slice(0, 500),
      platform: String(body.platform || body.device?.platform || "").slice(
        0,
        64
      ),
    };

    let token = "";
    try {
      token = await createSession(user.id, device);
    } catch (e) {
      console.error("register createSession", e);
      return NextResponse.json({
        ok: true,
        username: user.username,
        uid: user.uid || null,
        storage: "neon",
        sessionWarning: "Tạo tài khoản thành công. Vui lòng đăng nhập.",
      });
    }

    const res = NextResponse.json({
      ok: true,
      username: user.username,
      uid: user.uid || null,
      storage: "neon",
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(30 * 24 * 60 * 60));
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi đăng ký";
    console.error("register", e);
    if (/quota|exceeded|402/i.test(msg)) {
      return NextResponse.json(
        {
          ok: false,
          error: "CSDL đang hết hạn mức. Liên hệ quản trị viên.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
