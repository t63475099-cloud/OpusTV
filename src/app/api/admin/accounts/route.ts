import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function assertAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET || "";
  const header = req.headers.get("x-admin-secret") || "";
  if (!secret || header !== secret) {
    return false;
  }
  return true;
}

function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(8).toString("hex");
  const hash = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return { salt: s, hash, stored: `${s}$${hash}` };
}

function randomUid() {
  let n = "";
  for (let i = 0; i < 10; i++) n += Math.floor(Math.random() * 10).toString();
  return n;
}

/** Optional Neon SQL — falls back to in-memory if DATABASE_URL missing (dev). */
async function getSql(): Promise<null | ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>)> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  try {
    const { neon } = await import("@neondatabase/serverless");
    return neon(url) as unknown as (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>;
  } catch {
    return null;
  }
}

type Row = Record<string, unknown>;

function mapUser(r: Row) {
  const role = String(r.role || "USER").toUpperCase();
  return {
    id: String(r.id),
    username: String(r.username || ""),
    displayName: (r.display_name as string) || null,
    uid: String(r.uid || r.public_uid || ""),
    role: role === "ADMIN" || role === "VIP" ? role : "USER",
    coins: Number(r.coins || 0),
    avatarUrl: (r.avatar_url as string) || null,
    isVerified: !!(r.is_verified ?? r.verified),
    locked: !!(r.locked ?? r.is_locked),
    online: !!(r.online ?? r.is_online),
    vipExpiresAt: r.vip_expires_at ? String(r.vip_expires_at) : null,
    vipPermanent: !!(r.vip_permanent),
    createdAt: r.created_at ? String(r.created_at) : null,
    email: (r.email as string) || null,
    deviceCount: Number(r.device_count || 0),
    maxDevices: Number(r.max_devices || 2),
    lastPlatform: (r.last_platform as string) || "WEB",
  };
}

export async function GET(req: NextRequest) {
  if (!assertAdmin(req)) return err("Unauthorized", 403);
  const action = req.nextUrl.searchParams.get("action") || "list";
  const sql = await getSql();

  if (action === "list") {
    if (!sql) return ok({ users: [] });
    try {
      const rows = (await sql`
        SELECT id, username, display_name, uid, role, coins, avatar_url,
               COALESCE(is_verified, false) AS is_verified,
               COALESCE(locked, false) AS locked,
               vip_expires_at, COALESCE(vip_permanent, false) AS vip_permanent,
               created_at, email
        FROM users
        ORDER BY created_at DESC NULLS LAST
        LIMIT 2000
      `) as Row[];
      return ok({ users: rows.map(mapUser) });
    } catch (e) {
      return err(e instanceof Error ? e.message : "DB error", 500);
    }
  }

  if (action === "sessions") {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return err("Thiếu userId");
    if (!sql) return ok({ sessions: [] });
    try {
      const rows = (await sql`
        SELECT id, device_label, platform, ip_address, last_active_at, status
        FROM user_sessions
        WHERE user_id = ${userId}
        ORDER BY last_active_at DESC NULLS LAST
        LIMIT 50
      `) as Row[];
      return ok({
        sessions: rows.map((s) => ({
          id: String(s.id),
          deviceLabel: String(s.device_label || "Thiết bị"),
          platform: String(s.platform || ""),
          ipAddress: s.ip_address ? String(s.ip_address) : null,
          lastActiveAt: s.last_active_at ? String(s.last_active_at) : null,
          status: s.status ? String(s.status) : null,
        })),
      });
    } catch {
      return ok({ sessions: [] });
    }
  }

  return err("Action không hỗ trợ");
}

export async function POST(req: NextRequest) {
  if (!assertAdmin(req)) return err("Unauthorized", 403);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const sql = await getSql();
  if (!sql) return err("Database chưa cấu hình (DATABASE_URL)", 503);

  try {
    switch (action) {
      case "set_role": {
        const userId = String(body.userId || "");
        const role = String(body.role || "USER").toUpperCase();
        if (!userId) return err("Thiếu userId");
        await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
        return ok({ ok: true });
      }
      case "set_verified": {
        await sql`UPDATE users SET is_verified = ${!!body.verified} WHERE id = ${String(body.userId)}`;
        return ok({ ok: true });
      }
      case "set_locked": {
        await sql`UPDATE users SET locked = ${!!body.locked} WHERE id = ${String(body.userId)}`;
        return ok({ ok: true });
      }
      case "reset_avatar": {
        await sql`UPDATE users SET avatar_url = NULL WHERE id = ${String(body.userId)}`;
        return ok({ ok: true });
      }
      case "set_password": {
        const password = String(body.password || "");
        if (password.length < 4) return err("Mật khẩu quá ngắn");
        const { stored } = hashPassword(password);
        await sql`UPDATE users SET password_hash = ${stored} WHERE id = ${String(body.userId)}`;
        return ok({ ok: true });
      }
      case "adjust_vip": {
        const userId = String(body.userId || "");
        if (body.days === "clear") {
          await sql`UPDATE users SET vip_expires_at = NULL, vip_permanent = false WHERE id = ${userId}`;
          return ok({ ok: true });
        }
        const days = Number(body.days);
        if (!Number.isFinite(days)) return err("days không hợp lệ");
        await sql`
          UPDATE users SET vip_expires_at = COALESCE(vip_expires_at, NOW()) + (${days} || ' days')::interval
          WHERE id = ${userId}
        `;
        return ok({ ok: true });
      }
      case "bulk_coins": {
        const ids = body.userIds as string[];
        const amount = Number(body.amount);
        if (!Array.isArray(ids) || !ids.length) return err("Thiếu userIds");
        if (!Number.isFinite(amount)) return err("amount không hợp lệ");
        for (const id of ids) {
          await sql`UPDATE users SET coins = GREATEST(0, COALESCE(coins, 0) + ${amount}) WHERE id = ${id}`;
        }
        return ok({ ok: true, count: ids.length });
      }
      case "bulk_vip_days": {
        const ids = body.userIds as string[];
        const days = Number(body.days);
        if (!Array.isArray(ids) || !ids.length) return err("Thiếu userIds");
        for (const id of ids) {
          await sql`
            UPDATE users SET vip_expires_at = COALESCE(vip_expires_at, NOW()) + (${days} || ' days')::interval
            WHERE id = ${id}
          `;
        }
        return ok({ ok: true });
      }
      case "bulk_verify": {
        const ids = body.userIds as string[];
        for (const id of ids) {
          await sql`UPDATE users SET is_verified = ${!!body.verified} WHERE id = ${id}`;
        }
        return ok({ ok: true });
      }
      case "bulk_lock": {
        const ids = body.userIds as string[];
        for (const id of ids) {
          await sql`UPDATE users SET locked = ${!!body.locked} WHERE id = ${id}`;
        }
        return ok({ ok: true });
      }
      case "bulk_delete": {
        const ids = (body.userIds as string[]) || [];
        for (const id of ids) {
          await sql`DELETE FROM users WHERE id = ${id} AND UPPER(COALESCE(role, 'USER')) <> 'ADMIN'`;
        }
        return ok({ ok: true });
      }
      case "delete_user": {
        await sql`DELETE FROM users WHERE id = ${String(body.userId)} AND UPPER(COALESCE(role, 'USER')) <> 'ADMIN'`;
        return ok({ ok: true });
      }
      case "purge_non_admin_users": {
        if (body.confirm !== "XOA TAT CA") return err("Xác nhận không khớp");
        await sql`DELETE FROM users WHERE UPPER(COALESCE(role, 'USER')) <> 'ADMIN'`;
        return ok({ ok: true });
      }
      case "create_user": {
        const username = String(body.username || "").trim();
        const password = String(body.password || "");
        if (!username || !password) return err("Thiếu username/password");
        const { stored } = hashPassword(password);
        const uid = randomUid();
        await sql`
          INSERT INTO users (id, username, password_hash, uid, role, coins, created_at)
          VALUES (${randomBytes(16).toString("hex")}, ${username}, ${stored}, ${uid}, 'USER', 0, NOW())
        `;
        return ok({ ok: true, uid });
      }
      case "bulk_create": {
        const count = Math.min(500, Math.max(1, Number(body.count) || 0));
        const prefix = String(body.prefix || "user_");
        const fixedPw = body.password ? String(body.password) : "";
        const accounts: { username: string; password: string }[] = [];
        for (let i = 0; i < count; i++) {
          const suffix = randomBytes(3).toString("hex");
          const username = `${prefix}${suffix}`;
          const password = fixedPw || randomBytes(4).toString("hex");
          const { stored } = hashPassword(password);
          const uid = randomUid();
          try {
            await sql`
              INSERT INTO users (id, username, password_hash, uid, role, coins, created_at)
              VALUES (${randomBytes(16).toString("hex")}, ${username}, ${stored}, ${uid}, 'USER', 0, NOW())
            `;
            accounts.push({ username, password });
          } catch {
            /* skip duplicate */
          }
        }
        return ok({ ok: true, accounts });
      }
      case "update_user": {
        const userId = String(body.userId || "");
        if (body.displayName !== undefined) {
          await sql`UPDATE users SET display_name = ${String(body.displayName)} WHERE id = ${userId}`;
        }
        if (body.coins !== undefined && Number.isFinite(Number(body.coins))) {
          await sql`UPDATE users SET coins = ${Number(body.coins)} WHERE id = ${userId}`;
        }
        if (body.password) {
          const { stored } = hashPassword(String(body.password));
          await sql`UPDATE users SET password_hash = ${stored} WHERE id = ${userId}`;
        }
        return ok({ ok: true });
      }
      case "global_compensation": {
        const audience = String(body.audience || "all");
        const vipDays = Number(body.vipDays || 0);
        const coins = Number(body.coins || 0);
        const message = String(body.message || "");
        let whereSql = "TRUE";
        if (audience === "vip") whereSql = "(vip_permanent = true OR vip_expires_at > NOW())";
        if (audience === "online") whereSql = "COALESCE(is_online, false) = true";
        if (coins) {
          await sql`UPDATE users SET coins = COALESCE(coins, 0) + ${coins}`;
        }
        if (vipDays) {
          await sql`UPDATE users SET vip_expires_at = COALESCE(vip_expires_at, NOW()) + (${vipDays} || ' days')::interval`;
        }
        if (message) {
          try {
            await sql`
              INSERT INTO system_announcements (id, title, content, is_active, created_at)
              VALUES (${randomBytes(16).toString("hex")}, ${"Thông báo hệ thống"}, ${message}, true, NOW())
            `;
          } catch {
            /* optional table */
          }
        }
        return ok({ ok: true });
      }
      case "revoke_session": {
        await sql`DELETE FROM user_sessions WHERE id = ${String(body.sessionId)} AND user_id = ${String(body.userId)}`;
        return ok({ ok: true });
      }
      case "revoke_all_sessions": {
        await sql`DELETE FROM user_sessions WHERE user_id = ${String(body.userId)}`;
        try {
          await sql`UPDATE users SET session_version = COALESCE(session_version, 0) + 1 WHERE id = ${String(body.userId)}`;
        } catch {
          /* optional column */
        }
        return ok({ ok: true });
      }
      default:
        return err(`Action không hỗ trợ: ${action}`);
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : "Server error", 500);
  }
}
