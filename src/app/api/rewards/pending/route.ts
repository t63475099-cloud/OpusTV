import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

async function ensure() {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS global_broadcast_rewards (
      id SERIAL PRIMARY KEY,
      reward_type TEXT NOT NULL DEFAULT 'coins',
      reward_value TEXT NOT NULL DEFAULT '0',
      message_template TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_reward_claims (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_id INTEGER NOT NULL,
      claimed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, reward_id)
    )
  `;
}

export async function GET(req: NextRequest) {
  try {
    const username = (req.nextUrl.searchParams.get("username") || "").trim().toLowerCase();
    if (!username) return NextResponse.json({ ok: true, reward: null });
    await ensure();
    const sql = db();
    const rows = await sql`
      SELECT r.id, r.reward_type, r.reward_value, r.message_template, r.created_at
      FROM global_broadcast_rewards r
      WHERE r.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1 FROM user_reward_claims c
          WHERE c.reward_id = r.id AND lower(c.user_id) = ${username}
        )
      ORDER BY r.id DESC
      LIMIT 1
    `;
    return NextResponse.json({ ok: true, reward: rows[0] || null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim().toLowerCase();
    const rewardId = Number(body.rewardId || body.reward_id || 0);
    if (!username || !rewardId) {
      return NextResponse.json({ ok: false, error: "Thiếu username/rewardId" }, { status: 400 });
    }
    await ensure();
    const sql = db();
    const rewards = await sql`
      SELECT id, reward_type, reward_value FROM global_broadcast_rewards
      WHERE id = ${rewardId} AND is_active = TRUE LIMIT 1
    `;
    if (!rewards.length) {
      return NextResponse.json({ ok: false, error: "Đợt quà không tồn tại" }, { status: 404 });
    }
    const r = rewards[0] as { id: number; reward_type: string; reward_value: string };
    try {
      await sql`
        INSERT INTO user_reward_claims (user_id, reward_id)
        VALUES (${username}, ${rewardId})
      `;
    } catch {
      return NextResponse.json({ ok: false, error: "Đã nhận quà đợt này" }, { status: 409 });
    }

    const users = await sql`SELECT id FROM users WHERE lower(username) = ${username} LIMIT 1`;
    if (!users.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy user" }, { status: 404 });
    }
    const uid = Number((users[0] as { id: number }).id);
    const type = String(r.reward_type);
    const val = Number(r.reward_value) || 0;

    if (type === "coins" && val > 0) {
      try {
        await sql`UPDATE users SET coins = COALESCE(coins, 0) + ${val}, updated_at = NOW() WHERE id = ${uid}`;
      } catch { /* */ }
    } else if (type === "vip_hours" && val > 0) {
      try {
        await sql`
          UPDATE users SET
            vip_expires_at = GREATEST(COALESCE(vip_expires_at, NOW()), NOW()) + (${String(val)} || ' hours')::interval,
            expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + (${String(val)} || ' hours')::interval,
            role = CASE WHEN role = 'Admin' THEN role ELSE 'VIP' END,
            updated_at = NOW()
          WHERE id = ${uid}
        `;
      } catch { /* */ }
    } else if (type === "vip_lifetime") {
      try {
        await sql`
          UPDATE users SET is_lifetime_vip = TRUE,
            role = CASE WHEN role = 'Admin' THEN role ELSE 'VIP' END,
            updated_at = NOW()
          WHERE id = ${uid}
        `;
      } catch { /* */ }
    }

    return NextResponse.json({
      ok: true,
      message: "Đã nhận thưởng",
      reward_type: type,
      reward_value: r.reward_value,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
