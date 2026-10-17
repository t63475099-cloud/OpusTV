import { sql } from "@/lib/neonSql";
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
import { generateOpusVipKey } from "@/lib/keyEngine";
import { ensureVipTables } from "@/lib/vipDb";
import { getVipTier } from "@/lib/vipCatalog";
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

function mapDbError(e: unknown): { status: number; error: string } {
  const msg = e instanceof Error ? e.message : String(e);
  if (/402|exceeded the quota|Upgrade your plan/i.test(msg)) {
    return {
      status: 503,
      error:
        "CSDL Neon đã hết hạn mức (quota). Vào console.neon.tech kiểm tra project, nâng gói hoặc đợi quota reset — không phải lỗi mật khẩu admin.",
    };
  }
  if (/Too many connections/i.test(msg)) {
    return {
      status: 503,
      error: "Neon quá tải kết nối. Đợi 1–2 phút rồi thử lại.",
    };
  }
  return { status: 500, error: msg };
}

function requireAdmin(req: NextRequest): boolean {
  const secret = adminSecretFromRequest(req.headers, req.nextUrl.searchParams);
  return isAdminSecretValid(secret);
}

let schemaReady = false;
let schemaInflight: Promise<void> | null = null;

async function ensureSchema() {
  if (schemaReady) return;
  if (schemaInflight) return schemaInflight;
  schemaInflight = (async () => {
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
  schemaReady = true;
  })().finally(() => {
    schemaInflight = null;
  });
  return schemaInflight;
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
      // Legacy activation_keys
      let keys = await listKeys({ limit, tier: "ALL", status: "all" });
      // Opus VIP keys (license_keys_v2) — generate_opus_keys ghi vào đây
      try {
        await ensureVipTables();
        const sql = db();
        const v2 = await sql`
          SELECT id::text AS id, key_code, tier_code, status, claimed_username, claimed_at, created_at
          FROM license_keys_v2
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
        const mapped = (v2 as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          keyCode: String(r.key_code),
          tier: String(r.tier_code || "24H"),
          status:
            String(r.status) === "CLAIMED"
              ? "used"
              : String(r.status) === "REVOKED"
                ? "revoked"
                : "active",
          usedBy: r.claimed_username ? String(r.claimed_username) : null,
          usedAt: r.claimed_at ? String(r.claimed_at) : null,
          createdAt: r.created_at ? String(r.created_at) : new Date().toISOString(),
          expiresAt: null as string | null,
          note: "",
        }));
        const seen = new Set(keys.map((k) => k.keyCode));
        for (const m of mapped) {
          if (!seen.has(m.keyCode)) {
            keys.unshift(m as never);
            seen.add(m.keyCode);
          }
        }
      } catch {
        /* v2 optional */
      }
      if (tier !== "ALL") {
        keys = keys.filter((k) => String(k.tier).toUpperCase() === tier);
      }
      if (statusParam && statusParam !== "all") {
        keys = keys.filter((k) => k.status === statusParam);
      }
      keys = keys.slice(0, limit);
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
    const mapped = mapDbError(e);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
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

    
    if (action === "bulk_create_accounts") {
      await ensureSchema();
      const sql = db();
      await sql`
        CREATE TABLE IF NOT EXISTS bulk_creation_logs (
          id SERIAL PRIMARY KEY,
          created_count INT NOT NULL DEFAULT 0,
          requested_count INT NOT NULL DEFAULT 0,
          prefix TEXT DEFAULT 'user_',
          created_by TEXT DEFAULT 'admin',
          usernames JSONB DEFAULT '[]'::jsonb,
          accounts JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      const count = Math.min(200, Math.max(1, Number(body.count) || 1));
      const prefix = String(body.prefix || "user_")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24) || "user_";
      const createdBy = String(body.created_by || body.createdBy || "admin").slice(0, 64);
      const defaultPass = String(
        body.password || "Opus@" + Math.random().toString(36).slice(2, 8)
      );
      const passwordHash = await hashPassword(defaultPass);
      const pinHash = await hashPassword(randomAdminPin(6));
      const created: Array<{ username: string; password: string; uid: string }> = [];
      let seq = Date.now() % 1000000;
      for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < 20; attempt++) {
          seq += 1;
          const suffix = `${seq}${Math.floor(Math.random() * 90 + 10)}`;
          const username = `${prefix}${suffix}`.slice(0, 32);
          try {
            const uid = generateUid();
            await sql`
              INSERT INTO users (username, password_hash, recovery_pin_hash, uid, role, verified, updated_at)
              VALUES (${username}, ${passwordHash}, ${pinHash}, ${uid}, 'User', 0, NOW())
            `;
            created.push({ username, password: defaultPass, uid });
            break;
          } catch {
            /* duplicate → retry */
          }
        }
      }
      try {
        await sql`ALTER TABLE bulk_creation_logs ADD COLUMN IF NOT EXISTS accounts JSONB DEFAULT '[]'::jsonb`;
      } catch { /* */ }
      try {
        await sql`
          INSERT INTO bulk_creation_logs (created_count, requested_count, prefix, created_by, usernames, accounts)
          VALUES (
            ${created.length},
            ${count},
            ${prefix},
            ${createdBy},
            ${JSON.stringify(created.map((c) => c.username))}::jsonb,
            ${JSON.stringify(created)}::jsonb
          )
        `;
      } catch {
        try {
          await sql`
            INSERT INTO bulk_creation_logs (created_count, requested_count, prefix, created_by, usernames)
            VALUES (
              ${created.length},
              ${count},
              ${prefix},
              ${createdBy},
              ${JSON.stringify(created.map((c) => c.username))}::jsonb
            )
          `;
        } catch { /* */ }
      }
      return NextResponse.json({
        ok: true,
        message: `Đã tạo ${created.length}/${count} tài khoản`,
        accounts: created,
        defaultPassword: defaultPass,
      });
    }

    if (action === "list_bulk_logs") {
      await ensureSchema();
      const sql = db();
      await sql`
        CREATE TABLE IF NOT EXISTS bulk_creation_logs (
          id SERIAL PRIMARY KEY,
          created_count INT NOT NULL DEFAULT 0,
          requested_count INT NOT NULL DEFAULT 0,
          prefix TEXT DEFAULT 'user_',
          created_by TEXT DEFAULT 'admin',
          usernames JSONB DEFAULT '[]'::jsonb,
          accounts JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      const rows = await sql`
        SELECT id, created_count, requested_count, prefix, created_by, usernames, accounts, created_at
        FROM bulk_creation_logs
        ORDER BY id DESC LIMIT 30
      `;
      return NextResponse.json({ ok: true, logs: rows });
    }

    if (action === "delete_all_accounts") {
      const confirm1 = String(body.confirm1 || "").trim();
      const confirm2 = String(body.confirm2 || "").trim();
      if (confirm1 !== "XOA_TAT_CA" || confirm2 !== "CONFIRM") {
        return NextResponse.json(
          { ok: false, error: "Xác nhận 2 lớp không khớp (XOA_TAT_CA + CONFIRM)" },
          { status: 400 }
        );
      }
      await ensureSchema();
      const sql = db();
      let deleted = 0;
      try {
        const r = await sql`DELETE FROM users RETURNING id`;
        deleted = r.length;
      } catch (e: unknown) {
        const mapped = mapDbError(e);
        return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
      }
      try { await sql`DELETE FROM sessions`; } catch { /* */ }
      try { await sql`DELETE FROM user_bans`; } catch { /* */ }
      return NextResponse.json({
        ok: true,
        message: `Đã xóa ${deleted} tài khoản`,
        deleted,
      });
    }


    if (action === "create_broadcast_reward") {
      await ensureSchema();
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
      const rewardType = String(body.reward_type || body.rewardType || "coins");
      const rewardValue = String(body.reward_value || body.rewardValue || "0");
      const message = String(body.message || body.message_template || "").slice(0, 500);
      const rows = await sql`
        INSERT INTO global_broadcast_rewards (reward_type, reward_value, message_template, is_active)
        VALUES (${rewardType}, ${rewardValue}, ${message}, TRUE)
        RETURNING id, reward_type, reward_value, message_template, created_at, is_active
      `;
      return NextResponse.json({
        ok: true,
        message: "Đã phát thưởng toàn server",
        reward: rows[0],
      });
    }

    if (action === "list_broadcast_rewards") {
      await ensureSchema();
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
      const rows = await sql`
        SELECT id, reward_type, reward_value, message_template, created_at, is_active
        FROM global_broadcast_rewards
        ORDER BY id DESC LIMIT 50
      `;
      return NextResponse.json({ ok: true, rewards: rows });
    }

    if (action === "deactivate_broadcast") {
      const id = Number(body.id || 0);
      if (!id) return NextResponse.json({ ok: false, error: "Thiếu id" }, { status: 400 });
      const sql = db();
      await sql`UPDATE global_broadcast_rewards SET is_active = FALSE WHERE id = ${id}`;
      return NextResponse.json({ ok: true, message: "Đã tắt đợt phát thưởng" });
    }


    
    if (action === "create_announcement") {
      const sql = db();
      await sql`
        CREATE TABLE IF NOT EXISTS system_announcements (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          image_url TEXT DEFAULT '',
          link_action TEXT DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // Chỉ 1 active: tắt cái cũ
      await sql`UPDATE system_announcements SET is_active = FALSE WHERE is_active = TRUE`;
      const title = String(body.title || "").slice(0, 120);
      const content = String(body.content || "").slice(0, 500);
      const imageUrl = String(body.image_url || body.imageUrl || "").slice(0, 900_000);
      const linkAction = String(body.link_action || body.linkAction || "").slice(0, 500);
      const rows = await sql`
        INSERT INTO system_announcements (title, content, image_url, link_action, is_active)
        VALUES (${title}, ${content}, ${imageUrl}, ${linkAction}, TRUE)
        RETURNING id, title, content, image_url, link_action, is_active, created_at
      `;
      return NextResponse.json({
        ok: true,
        message: "Đã đăng thông báo chào mừng",
        announcement: rows[0],
      });
    }

    if (action === "deactivate_announcements") {
      const sql = db();
      try {
        await sql`UPDATE system_announcements SET is_active = FALSE WHERE is_active = TRUE`;
      } catch {
        /* */
      }
      return NextResponse.json({ ok: true, message: "Đã tắt thông báo" });
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

    
    if (action === "update_account") {
      const id = Number(body.id || body.userId || 0);
      const username = String(body.username || "").trim().toLowerCase();
      if (!id && !username) {
        return NextResponse.json({ ok: false, error: "Thiếu id/username" }, { status: 400 });
      }
      const role = body.role != null ? String(body.role) : null;
      const email = body.email !== undefined ? (String(body.email || "").trim() || null) : undefined;
      const verified =
        body.verified === undefined
          ? null
          : body.verified === true || body.verified === 1 || body.verified === "1"
            ? 1
            : 0;
      let expiresAt: string | null | undefined = undefined;
      if (body.clearVip === true) {
        expiresAt = null;
        try {
          if (id > 0) {
            await sql`UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = NULL WHERE id = ${id}`;
          } else {
            await sql`UPDATE users SET is_lifetime_vip = FALSE, vip_expires_at = NULL WHERE lower(username) = ${username}`;
          }
        } catch {
          /* optional cols */
        }
      } else if (body.expiresAt !== undefined) {
        const raw = String(body.expiresAt || "").trim();
        expiresAt = raw ? new Date(raw).toISOString() : null;
      } else if (body.expiresDays != null && body.expiresDays !== "") {
        const days = Number(body.expiresDays);
        if (Number.isFinite(days) && days > 0) {
          expiresAt = new Date(Date.now() + days * 86400000).toISOString();
        }
      }

      if (role != null && !["User", "VIP", "Admin"].includes(role)) {
        return NextResponse.json({ ok: false, error: "Role không hợp lệ" }, { status: 400 });
      }

      // Build updates carefully
      if (id > 0) {
        if (role != null) {
          await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id}`;
        }
        if (email !== undefined) {
          await sql`UPDATE users SET email = ${email}, updated_at = NOW() WHERE id = ${id}`;
        }
        if (verified !== null) {
          await sql`UPDATE users SET verified = ${verified}, updated_at = NOW() WHERE id = ${id}`;
        }
        if (expiresAt !== undefined) {
          await sql`UPDATE users SET expires_at = ${expiresAt}::timestamptz, updated_at = NOW() WHERE id = ${id}`;
          try {
            await sql`UPDATE users SET vip_expires_at = ${expiresAt}::timestamptz WHERE id = ${id}`;
          } catch {
            /* */
          }
        }
      } else {
        if (role != null) {
          await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE lower(username) = ${username}`;
        }
        if (email !== undefined) {
          await sql`UPDATE users SET email = ${email}, updated_at = NOW() WHERE lower(username) = ${username}`;
        }
        if (verified !== null) {
          await sql`UPDATE users SET verified = ${verified}, updated_at = NOW() WHERE lower(username) = ${username}`;
        }
        if (expiresAt !== undefined) {
          await sql`UPDATE users SET expires_at = ${expiresAt}::timestamptz, updated_at = NOW() WHERE lower(username) = ${username}`;
          try {
            await sql`UPDATE users SET vip_expires_at = ${expiresAt}::timestamptz WHERE lower(username) = ${username}`;
          } catch {
            /* */
          }
        }
      }

      if (body.coinsDelta != null && Number(body.coinsDelta) !== 0) {
        const delta = Number(body.coinsDelta);
        try {
          if (id > 0) {
            await sql`UPDATE users SET coins = GREATEST(0, COALESCE(coins, 0) + ${delta}), updated_at = NOW() WHERE id = ${id}`;
          } else {
            await sql`UPDATE users SET coins = GREATEST(0, COALESCE(coins, 0) + ${delta}), updated_at = NOW() WHERE lower(username) = ${username}`;
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          return NextResponse.json({ ok: false, error: msg }, { status: 400 });
        }
      }

      return NextResponse.json({ ok: true, message: "Đã cập nhật tài khoản" });
    }


    if (action === "stats") {
      const stats = await getStats();
      return NextResponse.json({ ok: true, stats });
    }

    
    if (action === "generate_opus_keys") {
      await ensureVipTables();
      const tierCode = String(body.tierCode || body.tier || "24H");
      const tier = getVipTier(tierCode);
      if (!tier) {
        return NextResponse.json({ ok: false, error: "Tier không hợp lệ" }, { status: 400 });
      }
      const count = Math.min(50, Math.max(1, Number(body.count) || 1));
      const codes: string[] = [];
      for (let i = 0; i < count; i++) {
        const code = generateOpusVipKey(tier.code);
        await sql`
          INSERT INTO license_keys_v2 (key_code, tier_code, status)
          VALUES (${code}, ${tier.code}, 'AVAILABLE')
          ON CONFLICT (key_code) DO NOTHING
        `;
        try {
          await sql`
            INSERT INTO activation_keys (code, note, tier)
            VALUES (${code}, ${"opus:" + tier.code}, ${tier.code})
            ON CONFLICT (code) DO NOTHING
          `;
        } catch {
          /* activation_keys optional mirror */
        }
        codes.push(code);
      }
      return NextResponse.json({
        ok: true,
        message: `Đã sinh ${codes.length} key ${tier.label}`,
        keys: codes,
      });
    }

    if (action === "delete_opus_key") {
      await ensureVipTables();
      const code = String(body.code || "").toUpperCase();
      await sql`DELETE FROM license_keys_v2 WHERE key_code = ${code}`;
      return NextResponse.json({ ok: true, message: "Đã xóa key" });
    }

    
    
    if (action === "create_giftcode") {
      await ensureVipTables();
      const rawCode = String(body.code || "").trim().toUpperCase();
      const code =
        rawCode ||
        `GIFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`;

      const coinsReward = Math.max(
        0,
        parseInt(String(body.coins_reward ?? body.coins ?? "0"), 10) || 0
      );
      const vipHours = Math.max(
        0,
        parseInt(String(body.vip_hours ?? body.vipHours ?? "0"), 10) || 0
      );
      let vipTierKey: string | null = String(
        body.vip_tier_key ?? body.vipTierKey ?? ""
      )
        .trim()
        .toUpperCase();
      if (!vipTierKey || vipTierKey === "NONE") vipTierKey = null;

      const maxClaims = Math.max(
        1,
        parseInt(String(body.max_claims ?? body.maxUses ?? "1"), 10) || 1
      );

      const startsRaw = String(body.starts_at ?? body.startsAt ?? "").trim();
      const expiresRaw = String(body.expires_at ?? body.endsAt ?? body.expiresAt ?? "").trim();
      const toIsoOrNull = (raw: string): string | null => {
        if (!raw) return null;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString();
      };
      const parsedStartsAt = toIsoOrNull(startsRaw) || new Date().toISOString();
      const parsedExpiresAt = toIsoOrNull(expiresRaw);

      if (coinsReward === 0 && vipHours === 0 && !vipTierKey) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Vui lòng nhập hoặc chọn ít nhất 1 phần thưởng (Xu, Giờ VIP hoặc Gói VIP)",
          },
          { status: 400 }
        );
      }

      const rewards = [] as Array<Record<string, unknown>>;
      if (coinsReward > 0) rewards.push({ type: "coins", amount: coinsReward });
      if (vipHours > 0) rewards.push({ type: "vip_hours", hours: vipHours });
      if (vipTierKey) rewards.push({ type: "vip_tier", tier: vipTierKey });

      try {
        if (parsedExpiresAt) {
          await sql`
            INSERT INTO system_giftcodes (
              code, type, rewards, coins_reward, vip_hours, vip_tier_key,
              max_claims, current_claims, starts_at, expires_at, is_active, created_by
            ) VALUES (
              ${code},
              'GLOBAL_SHARED',
              ${JSON.stringify(rewards)}::jsonb,
              ${coinsReward},
              ${vipHours},
              ${vipTierKey},
              ${maxClaims},
              0,
              ${parsedStartsAt}::timestamptz,
              ${parsedExpiresAt}::timestamptz,
              TRUE,
              'admin'
            )
          `;
        } else {
          await sql`
            INSERT INTO system_giftcodes (
              code, type, rewards, coins_reward, vip_hours, vip_tier_key,
              max_claims, current_claims, starts_at, expires_at, is_active, created_by
            ) VALUES (
              ${code},
              'GLOBAL_SHARED',
              ${JSON.stringify(rewards)}::jsonb,
              ${coinsReward},
              ${vipHours},
              ${vipTierKey},
              ${maxClaims},
              0,
              ${parsedStartsAt}::timestamptz,
              NULL,
              TRUE,
              'admin'
            )
          `;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/unique|duplicate/i.test(msg)) {
          return NextResponse.json(
            { ok: false, error: "Mã Giftcode này đã tồn tại" },
            { status: 409 }
          );
        }
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }

      try {
        await sql`
          INSERT INTO giftcodes (code, coins, vip_tier, max_uses, used_count, starts_at, ends_at, is_active)
          VALUES (
            ${code},
            ${coinsReward},
            ${vipTierKey},
            ${maxClaims},
            0,
            ${parsedStartsAt}::timestamptz,
            ${parsedExpiresAt}::timestamptz,
            TRUE
          )
          ON CONFLICT (code) DO UPDATE SET
            coins = EXCLUDED.coins,
            vip_tier = EXCLUDED.vip_tier,
            max_uses = EXCLUDED.max_uses,
            starts_at = EXCLUDED.starts_at,
            ends_at = EXCLUDED.ends_at,
            is_active = TRUE
        `;
      } catch {
        /* legacy table optional */
      }

      return NextResponse.json({
        ok: true,
        message: `Đã tạo giftcode ${code}`,
        code,
      });
    }

    if (action === "list_giftcodes") {
      await ensureVipTables();
      try {
        const rows = await sql`
          SELECT id::text, code, coins_reward, vip_hours, vip_tier_key, max_claims, current_claims,
                 starts_at::text, expires_at::text, is_active, created_at::text, type, rewards
          FROM system_giftcodes
          ORDER BY created_at DESC
          LIMIT 200
        `;
        return NextResponse.json({ ok: true, giftcodes: rows });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
    }

    if (action === "toggle_giftcode") {
      await ensureVipTables();
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ ok: false, error: "Thiếu code" }, { status: 400 });
      }
      try {
        await sql`
          UPDATE system_giftcodes SET is_active = NOT COALESCE(is_active, TRUE) WHERE code = ${code}
        `;
        await sql`
          UPDATE giftcodes SET is_active = NOT COALESCE(is_active, TRUE) WHERE upper(code) = ${code}
        `;
        return NextResponse.json({ ok: true, message: "Đã đổi trạng thái giftcode" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
    }

    if (action === "delete_giftcode") {
      await ensureVipTables();
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) {
        return NextResponse.json({ ok: false, error: "Thiếu code" }, { status: 400 });
      }
      try {
        await sql`DELETE FROM system_giftcodes WHERE code = ${code}`;
        await sql`DELETE FROM giftcodes WHERE upper(code) = ${code}`;
        return NextResponse.json({ ok: true, message: "Đã xóa giftcode" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
    }


    return NextResponse.json({ ok: false, error: `Action không hỗ trợ: ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const mapped = mapDbError(e);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
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
    const mapped = mapDbError(e);
    return NextResponse.json({ ok: false, error: mapped.error }, { status: mapped.status });
  }
}
