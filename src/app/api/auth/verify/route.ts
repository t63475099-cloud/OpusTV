import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const db = getSql();
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 0`;
    await db`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        field TEXT NOT NULL,
        social_link TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const users = await db`
      SELECT verified FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    const verified = Number((users[0] as { verified?: number } | undefined)?.verified || 0) === 1;
    const reqs = await db`
      SELECT id, full_name, field, social_link, status, created_at, updated_at
      FROM verification_requests
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const latest = reqs[0] as
      | {
          id: number;
          full_name: string;
          field: string;
          social_link: string;
          status: string;
          created_at: string;
        }
      | undefined;
    return NextResponse.json({
      ok: true,
      verified,
      request: latest
        ? {
            id: latest.id,
            fullName: latest.full_name,
            field: latest.field,
            socialLink: latest.social_link,
            status: latest.status,
            createdAt: latest.created_at,
          }
        : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName || "").trim().slice(0, 120);
    const field = String(body.field || "").trim().slice(0, 80);
    const socialLink = String(body.socialLink || "").trim().slice(0, 300);

    if (fullName.length < 2) {
      return NextResponse.json({ ok: false, error: "Nhập họ và tên" }, { status: 400 });
    }
    if (field.length < 2) {
      return NextResponse.json({ ok: false, error: "Chọn lĩnh vực" }, { status: 400 });
    }

    const db = getSql();
    await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 0`;
    await db`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        field TEXT NOT NULL,
        social_link TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const users = await db`
      SELECT verified FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    if (Number((users[0] as { verified?: number } | undefined)?.verified || 0) === 1) {
      return NextResponse.json({ ok: false, error: "Tài khoản đã có tích xanh" }, { status: 400 });
    }

    const pending = await db`
      SELECT id FROM verification_requests
      WHERE user_id = ${session.userId} AND status = 'pending'
      LIMIT 1
    `;
    if (pending.length) {
      return NextResponse.json(
        { ok: false, error: "Bạn đã có yêu cầu đang chờ duyệt" },
        { status: 400 }
      );
    }

    await db`
      INSERT INTO verification_requests (user_id, full_name, field, social_link, status)
      VALUES (${session.userId}, ${fullName}, ${field}, ${socialLink}, 'pending')
    `;

    return NextResponse.json({
      ok: true,
      message:
        "Yêu cầu đã được ghi nhận. Tài khoản của bạn sẽ được đội ngũ kiểm duyệt và cấp tích xanh trong vòng 24 - 48 giờ tới.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
