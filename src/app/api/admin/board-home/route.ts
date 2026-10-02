import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@/lib/password";
import {
  adminSecretFromRequest,
  isAdminSecretValid,
  normalizeRole,
  randomAdminPin,
  type AdminAccount,
  type AdminRole,
  type SystemStats,
  type VerifyRequestItem,
} from "@/lib/adminEngine";
import {
  createKeys,
  deleteKey,
  deleteKeyById,
  listKeys,
  revokeKey,
  unrevokeKey,
} from "@/lib/db/keys";
import type { KeyTier } from "@/lib/keyEngine";
import { generateUid } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

function requireAdmin(req: NextRequest): boolean {
  const secret = adminSecretFromRequest(req.headers, req.nextUrl.searchParams);
  return isAdminSecretValid(secret);
}

async function ensureSchema() {
  const sql = db();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
  await sql`
    CREATE TABLE IF NOT EXISTS user_bans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      reason TEXT DEFAULT '',
      kind TEXT DEFAULT 'other',
      ban_until TIMESTAMPTZ,
      permanent BOOLEAN DEFAULT FALSE,
      ip_block TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS activation_keys (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      used_at TIMESTAMPTZ,
      used_by TEXT,
      note TEXT DEFAULT '',
      tier TEXT DEFAULT 'CUSTOM',
      revoked_at TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE activation_keys ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'CUSTOM'`;
  await sql`ALTER TABLE activation_keys ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`;
  await sql`
    CREATE TABLE IF NOT EXISTS verification_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      field TEXT NOT NULL,
      social_link TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_ai_logs (
      id SERIAL PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'summary',
      ref_id TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_purge_log (
      id SERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function listAccounts(q?: string): Promise<AdminAccount[]> {
  const sql = db();
  await ensureSchema();
  let rows: Record<string, unknown>[];
  if (q && q.trim()) {
    const like = `%${q.trim().toLowerCase()}%`;
    rows = (await sql`
      SELECT u.id, u.username, u.uid, u.email, u.role, u.verified, u.created_at, u.last_login, u.expires_at,
             b.reason AS ban_reason, b.ban_until, b.permanent
      FROM users u
      LEFT JOIN LATERAL (
        SELECT reason, ban_until, permanent FROM user_bans
        WHERE username = u.username
          AND (permanent = TRUE OR ban_until IS NULL OR ban_until > NOW())
        ORDER BY id DESC LIMIT 1
      ) b ON TRUE
      WHERE lower(u.username) LIKE ${like}
         OR (u.uid IS NOT NULL AND u.uid LIKE ${like})
         OR (u.email IS NOT NULL AND lower(u.email) LIKE ${like})
      ORDER BY u.created_at DESC
      LIMIT 300
    `) as Record<string, unknown>[];
  } else {
    rows = (await sql`
      SELECT u.id, u.username, u.uid, u.email, u.role, u.verified, u.created_at, u.last_login, u.expires_at,
             b.reason AS ban_reason, b.ban_until, b.permanent
      FROM users u
      LEFT JOIN LATERAL (
        SELECT reason, ban_until, permanent FROM user_bans
        WHERE username = u.username
          AND (permanent = TRUE OR ban_until IS NULL OR ban_until > NOW())
        ORDER BY id DESC LIMIT 1
      ) b ON TRUE
      ORDER BY u.created_at DESC
      LIMIT 300
    `) as Record<string, unknown>[];
  }

  return rows.map((r) => {
    const banned =
      r.permanent === true ||
      (r.ban_until != null && new Date(String(r.ban_until)).getTime() > Date.now()) ||
      (r.ban_reason != null && r.ban_until == null && r.permanent !== false && r.ban_reason !== "");
    // Treat presence of active ban row as banned
    const hasBan = r.ban_reason != null || r.ban_until != null || r.permanent === true;
    return {
      id: Number(r.id),
      username: String(r.username || ""),
      uid: r.uid != null ? String(r.uid) : null,
      email: r.email != null ? String(r.email) : null,
      role: normalizeRole(r.role),
      verified: Number(r.verified || 0) === 1,
      status: (hasBan ? "banned" : "active") as "active" | "banned",
      banReason: r.ban_reason != null ? String(r.ban_reason) : null,
      banUntil: r.ban_until != null ? String(r.ban_until) : null,
      createdAt: String(r.created_at || ""),
      lastLogin: r.last_login != null ? String(r.last_login) : null,
      expiresAt: r.expires_at != null ? String(r.expires_at) : null,
    };
  });
}

async function listVerify(): Promise<VerifyRequestItem[]> {
  const sql = db();
  await ensureSchema();
  const rows = await sql`
    SELECT r.id, r.user_id, r.full_name, r.field, r.social_link, r.status, r.created_at,
           u.username, u.verified
    FROM verification_requests r
    JOIN users u ON u.id = r.user_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC
    LIMIT 100
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    userId: Number(r.user_id),
    username: String(r.username || ""),
    fullName: String(r.full_name || ""),
    field: String(r.field || ""),
    socialLink: String(r.social_link || ""),
    status: String(r.status || "pending"),
    verified: Number(r.verified || 0) === 1,
    createdAt: String(r.created_at || ""),
  }));
}

async function getStats(): Promise<SystemStats> {
  const sql = db();
  await ensureSchema();
  const [u] = (await sql`SELECT COUNT(*)::int AS c FROM users`) as { c: number }[];
  const [k] = (await sql`SELECT COUNT(*)::int AS c FROM activation_keys`) as { c: number }[];
  const [ka] = (await sql`
    SELECT COUNT(*)::int AS c FROM activation_keys
    WHERE used_at IS NULL AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  `) as { c: number }[];
  const [v] = (await sql`
    SELECT COUNT(*)::int AS c FROM verification_requests WHERE status = 'pending'
  `) as { c: number }[];
  const [b] = (await sql`
    SELECT COUNT(*)::int AS c FROM user_bans
    WHERE permanent = TRUE OR ban_until IS NULL OR ban_until > NOW()
  `) as { c: number }[];
  let sessions = 0;
  try {
    const [s] = (await sql`SELECT COUNT(*)::int AS c FROM sessions`) as { c: number }[];
    sessions = Number(s?.c || 0);
  } catch {
    sessions = 0;
  }
  return {
    users: Number(u?.c || 0),
    keysTotal: Number(k?.c || 0),
    keysActive: Number(ka?.c || 0),
    pendingVerify: Number(v?.c || 0),
    bansActive: Number(b?.c || 0),
    sessions,
    serverTime: new Date().toISOString(),
  };
}

/** GET — list by section */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    await ensureSchema();
    const section = (req.nextUrl.searchParams.get("section") || "stats").toLowerCase();
    const q = req.nextUrl.searchParams.get("q") || "";

    if (section === "accounts") {
      const accounts = await listAccounts(q);
      return NextResponse.json({ ok: true, accounts, count: accounts.length });
    }
    if (section === "keys") {
      const tierParam = (req.nextUrl.searchParams.get("tier") || "ALL").toUpperCase();
      const statusParam = req.nextUrl.searchParams.get("status") || "all";
      const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 80)));
      const tier = (["24H", "12H", "CUSTOM", "ALL"].includes(tierParam)
        ? tierParam
        : "ALL") as KeyTier | "ALL";
      const keys = await listKeys({ limit, tier, status: statusParam });
      return NextResponse.json({ ok: true, keys, count: keys.length });
    }
    if (section === "verify") {
      const items = await listVerify();
      return NextResponse.json({ ok: true, items, count: items.length });
    }
    // stats / system
    const stats = await getStats();
    return NextResponse.json({ ok: true, stats });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** POST — mutations */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").toLowerCase();
    const sql = db();

    // ── Accounts ──────────────────────────────────────────
    if (action === "create_account") {
      const username = String(body.username || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "")
        .slice(0, 32);
      const password = String(body.password || "");
      const email = String(body.email || "").trim().slice(0, 120) || null;
      const role = normalizeRole(body.role);
      const days = Number(body.expiresDays);
      if (!username || username.length < 3) {
        return NextResponse.json({ ok: false, error: "Username tối thiểu 3 ký tự" }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ ok: false, error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });
      }
      const exists = await sql`SELECT id FROM users WHERE lower(username) = ${username} LIMIT 1`;
      if (exists.length) {
        return NextResponse.json({ ok: false, error: "Username đã tồn tại" }, { status: 409 });
      }
      const passwordHash = await hashPassword(password);
      const pin = randomAdminPin(6);
      const pinHash = await hashPassword(pin);
      let uid = generateUid();
      for (let i = 0; i < 6; i++) {
        const hit = await sql`SELECT id FROM users WHERE uid = ${uid} LIMIT 1`;
        if (!hit.length) break;
        uid = generateUid();
      }
      let expiresAt: string | null = null;
      if (Number.isFinite(days) && days > 0) {
        expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      }
      const inserted = await sql`
        INSERT INTO users (username, password_hash, recovery_pin_hash, uid, email, role, expires_at, verified, updated_at)
        VALUES (${username}, ${passwordHash}, ${pinHash}, ${uid}, ${email}, ${role}, ${expiresAt}, 0, NOW())
        RETURNING id, username, uid, role, created_at
      `;
      return NextResponse.json({
        ok: true,
        account: inserted[0],
        recoveryPin: pin,
        message: "Đã tạo tài khoản",
      });
    }

    if (action === "reset_password") {
      const id = Number(body.id || 0);
      const username = String(body.username || "").trim().toLowerCase();
      const newPassword = String(body.password || body.newPassword || "");
      if (newPassword.length < 8) {
        return NextResponse.json({ ok: false, error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });
      }
      const passwordHash = await hashPassword(newPassword);
      let rows;
      if (id > 0) {
        rows = await sql`
          UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
          WHERE id = ${id} RETURNING id, username
        `;
      } else if (username) {
        rows = await sql`
          UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
          WHERE lower(username) = ${username} RETURNING id, username
        `;
      } else {
        return NextResponse.json({ ok: false, error: "Thiếu id hoặc username" }, { status: 400 });
      }
      if (!rows.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, user: rows[0] });
    }

    if (action === "ban") {
      const username = String(body.username || "").trim();
      const reason = String(body.reason || "Vi phạm nội quy").slice(0, 300);
      const permanent = Boolean(body.permanent);
      const hours = Number(body.hours);
      if (!username) {
        return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
      }
      const users = await sql`SELECT id, username FROM users WHERE lower(username) = ${username.toLowerCase()} LIMIT 1`;
      if (!users.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      const u = users[0] as { id: number; username: string };
      let banUntil: string | null = null;
      if (!permanent && Number.isFinite(hours) && hours > 0) {
        banUntil = new Date(Date.now() + hours * 3600000).toISOString();
      }
      await sql`
        INSERT INTO user_bans (user_id, username, level, reason, kind, ban_until, permanent, ip_block)
        VALUES (${u.id}, ${u.username}, ${Number(body.level) || 1}, ${reason}, ${String(body.kind || "other")}, ${banUntil}, ${permanent}, ${""})
      `;
      try {
        const { forceLogoutUser } = await import("@/lib/session/store");
        await forceLogoutUser(u.id, reason || "Tài khoản bị khóa");
      } catch {
        /* */
      }
      return NextResponse.json({ ok: true, username: u.username, banUntil, permanent });
    }

    if (action === "unban") {
      const username = String(body.username || "").trim();
      if (!username) {
        return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
      }
      await sql`
        UPDATE user_bans
        SET ban_until = NOW() - INTERVAL '1 minute', permanent = FALSE
        WHERE lower(username) = ${username.toLowerCase()}
          AND (permanent = TRUE OR ban_until IS NULL OR ban_until > NOW())
      `;
      return NextResponse.json({ ok: true, username });
    }

    if (action === "delete_account") {
      const id = Number(body.id || 0);
      const username = String(body.username || "").trim().toLowerCase();
      if (!id && !username) {
        return NextResponse.json({ ok: false, error: "Thiếu id hoặc username" }, { status: 400 });
      }
      let target: { id: number; username: string } | null = null;
      if (id > 0) {
        const rows = await sql`SELECT id, username FROM users WHERE id = ${id} LIMIT 1`;
        target = (rows[0] as { id: number; username: string }) || null;
      } else {
        const rows = await sql`SELECT id, username FROM users WHERE lower(username) = ${username} LIMIT 1`;
        target = (rows[0] as { id: number; username: string }) || null;
      }
      if (!target) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      // cascade-like cleanup
      try {
        await sql`DELETE FROM sessions WHERE user_id = ${target.id}`;
      } catch { /* */ }
      try {
        await sql`DELETE FROM verification_requests WHERE user_id = ${target.id}`;
      } catch { /* */ }
      try {
        await sql`DELETE FROM user_bans WHERE user_id = ${target.id} OR lower(username) = ${target.username.toLowerCase()}`;
      } catch { /* */ }
      try {
        await sql`DELETE FROM watch_history WHERE user_id = ${target.id}`;
      } catch { /* */ }
      try {
        await sql`DELETE FROM favorites WHERE user_id = ${target.id}`;
      } catch { /* */ }
      try {
        await sql`DELETE FROM settings WHERE user_id = ${target.id}`;
      } catch { /* */ }
      const del = await sql`DELETE FROM users WHERE id = ${target.id} RETURNING id, username`;
      if (!del.length) {
        return NextResponse.json({ ok: false, error: "Xóa thất bại" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, deleted: del[0] });
    }

    // ── Keys ──────────────────────────────────────────────
    if (action === "generate_keys") {
      const count = Math.min(50, Math.max(1, Math.floor(Number(body.count) || 1)));
      const tier = (["24H", "12H", "CUSTOM"].includes(String(body.tier || "").toUpperCase())
        ? String(body.tier).toUpperCase()
        : "24H") as KeyTier;
      const customPrefix = body.customPrefix ? String(body.customPrefix) : undefined;
      const customHours = body.customHours != null ? Number(body.customHours) : undefined;
      const note = String(body.note || "").slice(0, 120);
      const codes = await createKeys(count, note, undefined, {
        tier,
        customPrefix,
        customHours,
      });
      return NextResponse.json({ ok: true, codes, count: codes.length, tier });
    }

    if (action === "revoke_key") {
      const code = String(body.code || body.keyCode || "");
      const r = await revokeKey(code);
      if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "unrevoke_key") {
      const code = String(body.code || body.keyCode || "");
      const r = await unrevokeKey(code);
      if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete_key") {
      const id = Number(body.id || 0);
      const code = String(body.code || body.keyCode || "");
      let r: { ok: boolean; error?: string };
      if (id > 0) r = await deleteKeyById(id);
      else r = await deleteKey(code);
      if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // ── Verify ────────────────────────────────────────────
    if (action === "approve_verify" || action === "reject_verify") {
      const id = Number(body.id || 0);
      if (!id) return NextResponse.json({ ok: false, error: "Thiếu id" }, { status: 400 });
      const rows = await sql`SELECT user_id FROM verification_requests WHERE id = ${id} LIMIT 1`;
      if (!rows.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy yêu cầu" }, { status: 404 });
      }
      const userId = (rows[0] as { user_id: number }).user_id;
      const status = action === "approve_verify" ? "approved" : "rejected";
      const note = String(body.note || "").slice(0, 200);
      await sql`
        UPDATE verification_requests
        SET status = ${status}, note = ${note}, updated_at = NOW()
        WHERE id = ${id}
      `;
      if (action === "approve_verify") {
        await sql`UPDATE users SET verified = 1, updated_at = NOW() WHERE id = ${userId}`;
      }
      return NextResponse.json({ ok: true, status });
    }

    if (action === "delete_verify") {
      const id = Number(body.id || 0);
      if (!id) return NextResponse.json({ ok: false, error: "Thiếu id" }, { status: 400 });
      const del = await sql`DELETE FROM verification_requests WHERE id = ${id} RETURNING id`;
      if (!del.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    }

    // ── System / AI Purge ─────────────────────────────────
    if (action === "purge_ai_metadata") {
      if (String(body.confirm || "") !== "CONFIRM") {
        return NextResponse.json({ ok: false, error: "Gõ CONFIRM để xác nhận" }, { status: 400 });
      }
      let deleted = 0;
      try {
        const r = await sql`DELETE FROM admin_ai_logs WHERE kind IN ('summary','metadata','ai_text') RETURNING id`;
        deleted += r.length;
      } catch { /* */ }
      // Clear AI-ish fields on video_social if exist
      try {
        await sql`ALTER TABLE video_social ADD COLUMN IF NOT EXISTS ai_summary TEXT`;
        const r2 = await sql`
          UPDATE video_social SET ai_summary = NULL
          WHERE ai_summary IS NOT NULL AND ai_summary <> ''
          RETURNING id
        `;
        deleted += r2.length;
      } catch { /* */ }
      await sql`
        INSERT INTO admin_purge_log (action, detail)
        VALUES ('purge_ai_metadata', ${`deleted=${deleted}`})
      `;
      return NextResponse.json({ ok: true, deleted, message: "Đã quét & xóa tóm tắt/metadata AI" });
    }

    if (action === "purge_ai_cache") {
      if (String(body.confirm || "") !== "CONFIRM") {
        return NextResponse.json({ ok: false, error: "Gõ CONFIRM để xác nhận" }, { status: 400 });
      }
      let deleted = 0;
      try {
        const r = await sql`DELETE FROM admin_ai_logs RETURNING id`;
        deleted += r.length;
      } catch { /* */ }
      try {
        // expire old sessions older than 30 days as cache cleanup
        const r2 = await sql`
          DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '1 day' RETURNING id
        `;
        deleted += r2.length;
      } catch { /* */ }
      await sql`
        INSERT INTO admin_purge_log (action, detail)
        VALUES ('purge_ai_cache', ${`deleted=${deleted}`})
      `;
      return NextResponse.json({ ok: true, deleted, message: "Đã xóa cache/lịch sử AI" });
    }

    if (action === "clean_orphans") {
      if (String(body.confirm || "") !== "CONFIRM") {
        return NextResponse.json({ ok: false, error: "Gõ CONFIRM để xác nhận" }, { status: 400 });
      }
      let deleted = 0;
      try {
        const r = await sql`
          DELETE FROM verification_requests
          WHERE user_id NOT IN (SELECT id FROM users)
          RETURNING id
        `;
        deleted += r.length;
      } catch { /* */ }
      try {
        const r2 = await sql`
          DELETE FROM sessions
          WHERE user_id NOT IN (SELECT id FROM users)
          RETURNING id
        `;
        deleted += r2.length;
      } catch { /* */ }
      try {
        const r3 = await sql`
          DELETE FROM user_bans
          WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)
          RETURNING id
        `;
        deleted += r3.length;
      } catch { /* */ }
      try {
        const r4 = await sql`
          DELETE FROM watch_history
          WHERE user_id NOT IN (SELECT id FROM users)
          RETURNING id
        `;
        deleted += r4.length;
      } catch { /* */ }
      try {
        const r5 = await sql`
          DELETE FROM favorites
          WHERE user_id NOT IN (SELECT id FROM users)
          RETURNING id
        `;
        deleted += r5.length;
      } catch { /* */ }
      await sql`
        INSERT INTO admin_purge_log (action, detail)
        VALUES ('clean_orphans', ${`deleted=${deleted}`})
      `;
      return NextResponse.json({ ok: true, deleted, message: "Đã dọn mục rác / bản ghi cô lập" });
    }

    if (action === "grant_coins") {
      const username = String(body.username || "").trim();
      const uid = String(body.uid || "").trim();
      const amount = Math.floor(Number(body.amount) || 0);
      const note = String(body.note || "Admin cấp xu").slice(0, 200);
      if ((!username && !uid) || amount < 1 || amount > 2_000_000_000) {
        return NextResponse.json(
          { ok: false, error: "Cần username/UID và số xu 1–2.000.000.000" },
          { status: 400 }
        );
      }
      let userRows;
      if (uid) {
        userRows = await sql`SELECT id, username FROM users WHERE uid = ${uid} LIMIT 1`;
      } else {
        userRows = await sql`
          SELECT id, username FROM users WHERE lower(username) = ${username.toLowerCase()} LIMIT 1
        `;
      }
      if (!userRows.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      const u = userRows[0] as { id: number; username: string };
      await sql`
        CREATE TABLE IF NOT EXISTS coin_grants (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          amount INTEGER NOT NULL,
          note TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO coin_grants (user_id, username, amount, note)
        VALUES (${u.id}, ${u.username}, ${amount}, ${note})
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS event_user_state (
          user_id INTEGER PRIMARY KEY,
          username TEXT NOT NULL DEFAULT '',
          coins BIGINT NOT NULL DEFAULT 0,
          streak_days INTEGER NOT NULL DEFAULT 0,
          last_check_in TEXT,
          claimed_check_in_day TEXT,
          mission_day TEXT,
          mission_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
          mission_claim_count JSONB NOT NULL DEFAULT '{}'::jsonb,
          completed_tasks INTEGER NOT NULL DEFAULT 0,
          double_exp_until TIMESTAMPTZ,
          vip_until TIMESTAMPTZ,
          last_spin JSONB,
          total_earned BIGINT NOT NULL DEFAULT 0,
          inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
          version BIGINT NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO event_user_state (user_id, username, coins, total_earned, version)
        VALUES (${u.id}, ${u.username}, ${amount}, ${amount}, 1)
        ON CONFLICT (user_id) DO UPDATE SET
          coins = event_user_state.coins + ${amount},
          total_earned = event_user_state.total_earned + ${amount},
          version = event_user_state.version + 1,
          updated_at = NOW()
      `;
      try {
        await sql`
          INSERT INTO account_state (user_id, state_version, coins, updated_at)
          VALUES (${u.id}, 1, ${amount}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            coins = account_state.coins + ${amount},
            state_version = account_state.state_version + 1,
            updated_at = NOW()
        `;
      } catch {
        /* */
      }
      try {
        const { broadcastAccountUpdate } = await import("@/lib/session/store");
        await broadcastAccountUpdate(u.id, "STATE_MUTATED", {
          message: `grant_coins:${amount}`,
          bumpVersion: true,
        });
      } catch {
        /* */
      }
      return NextResponse.json({
        ok: true,
        username: u.username,
        amount,
        message: `Đã cấp ${amount.toLocaleString("vi-VN")} xu cho ${u.username}`,
      });
    }

    if (action === "set_verified") {
      const id = Number(body.id || 0);
      const username = String(body.username || "").trim().toLowerCase();
      const verified =
        body.verified === true || body.verified === 1 || body.verified === "1";
      const flag = verified ? 1 : 0;
      let rows;
      if (id > 0) {
        rows = await sql`
          UPDATE users SET verified = ${flag}, updated_at = NOW()
          WHERE id = ${id} RETURNING id, username, verified
        `;
      } else if (username) {
        rows = await sql`
          UPDATE users SET verified = ${flag}, updated_at = NOW()
          WHERE lower(username) = ${username} RETURNING id, username, verified
        `;
      } else {
        return NextResponse.json({ ok: false, error: "Thiếu id hoặc username" }, { status: 400 });
      }
      if (!rows.length) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        user: rows[0],
        message: flag ? "Đã gắn tick xanh" : "Đã gỡ tick xanh",
      });
    }

    if (action === "stats") {
      const stats = await getStats();
      return NextResponse.json({ ok: true, stats });
    }

    return NextResponse.json({ ok: false, error: `Action không hỗ trợ: ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** PATCH — alias for soft updates (ban/unban/revoke) */
export async function PATCH(req: NextRequest) {
  return POST(req);
}

/** DELETE — via query action */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    const body = await req.json().catch(() => ({}));
    // Reuse POST with forced action if provided
    const action = String(body.action || req.nextUrl.searchParams.get("action") || "");
    if (!action) {
      return NextResponse.json({ ok: false, error: "Thiếu action" }, { status: 400 });
    }
    // Reconstruct a synthetic request-like flow by calling POST body
    const synthetic = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ ...body, action }),
    });
    return POST(synthetic);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
