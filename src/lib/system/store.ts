/**
 * System config store — Neon + cold-start retry
 */

import { neon } from "@neondatabase/serverless";
import type {
  FeatureFlags,
  PatchCompensation,
  SystemAuditLog,
  SystemConfig,
} from "@/lib/system/types";
import { DEFAULT_FLAGS, SCHEMA_VERSION } from "@/lib/system/types";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

/** Exponential backoff retry for Neon cold start */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  const delays = [200, 500, 1200];
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const transient =
        /timeout|ECONN|fetch failed|Cold|sleeping|connection|503|502|429/i.test(
          msg
        );
      if (!transient || i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delays[i] ?? 1200));
    }
  }
  throw lastErr;
}

let ensured = false;

export async function ensureSystemTables() {
  if (ensured) return;
  await withDbRetry(async () => {
    const sql = db();
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
        maintenance_message TEXT DEFAULT '',
        maintenance_until TIMESTAMPTZ,
        panic_lockdown BOOLEAN NOT NULL DEFAULT FALSE,
        feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
        schema_version INTEGER NOT NULL DEFAULT 1,
        build_id TEXT DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO system_config (id, feature_flags, schema_version)
      VALUES (1, ${JSON.stringify(DEFAULT_FLAGS)}::jsonb, ${SCHEMA_VERSION})
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS system_audit_logs (
        id BIGSERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        admin_id TEXT NOT NULL DEFAULT '',
        ip TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS system_audit_logs_created_idx ON system_audit_logs (created_at DESC)`;
    await sql`
      CREATE TABLE IF NOT EXISTS patch_compensations (
        patch_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        rewards JSONB NOT NULL DEFAULT '{}'::jsonb,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        claimed_users JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  });
  ensured = true;
}

function mapConfig(row: Record<string, unknown>): SystemConfig {
  const flags = {
    ...DEFAULT_FLAGS,
    ...((row.feature_flags as FeatureFlags) || {}),
  };
  return {
    maintenanceMode: !!row.maintenance_mode,
    maintenanceMessage: String(row.maintenance_message || ""),
    maintenanceUntil: row.maintenance_until
      ? String(row.maintenance_until)
      : null,
    panicLockdown: !!row.panic_lockdown,
    featureFlags: flags,
    schemaVersion: Number(row.schema_version || SCHEMA_VERSION),
    buildId: String(row.build_id || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_ID || "dev"),
    updatedAt: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
  };
}

/** In-memory cache for middleware-friendly reads (short TTL) */
let configCache: { at: number; cfg: SystemConfig } | null = null;
const CACHE_MS = 5000;

export async function getSystemConfig(force = false): Promise<SystemConfig> {
  if (!force && configCache && Date.now() - configCache.at < CACHE_MS) {
    return configCache.cfg;
  }
  await ensureSystemTables();
  const cfg = await withDbRetry(async () => {
    const sql = db();
    const rows = await sql`SELECT * FROM system_config WHERE id = 1 LIMIT 1`;
    if (!rows.length) {
      return mapConfig({
        maintenance_mode: false,
        feature_flags: DEFAULT_FLAGS,
        schema_version: SCHEMA_VERSION,
      });
    }
    return mapConfig(rows[0] as Record<string, unknown>);
  });
  configCache = { at: Date.now(), cfg };
  return cfg;
}

export function invalidateSystemConfigCache() {
  configCache = null;
}

export async function updateSystemConfig(
  patch: Partial<{
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maintenanceUntil: string | null;
    panicLockdown: boolean;
    featureFlags: Partial<FeatureFlags>;
    buildId: string;
  }>,
  audit?: { adminId: string; ip: string; action: string }
): Promise<SystemConfig> {
  await ensureSystemTables();
  const current = await getSystemConfig(true);
  const flags = { ...current.featureFlags, ...(patch.featureFlags || {}) };
  const maintenanceMode =
    patch.maintenanceMode != null ? patch.maintenanceMode : current.maintenanceMode;
  const maintenanceMessage =
    patch.maintenanceMessage != null
      ? patch.maintenanceMessage
      : current.maintenanceMessage;
  const maintenanceUntil =
    patch.maintenanceUntil !== undefined
      ? patch.maintenanceUntil
      : current.maintenanceUntil;
  const panicLockdown =
    patch.panicLockdown != null ? patch.panicLockdown : current.panicLockdown;
  const buildId = patch.buildId != null ? patch.buildId : current.buildId;

  await withDbRetry(async () => {
    const sql = db();
    await sql`
      UPDATE system_config SET
        maintenance_mode = ${maintenanceMode},
        maintenance_message = ${maintenanceMessage},
        maintenance_until = ${maintenanceUntil},
        panic_lockdown = ${panicLockdown},
        feature_flags = ${JSON.stringify(flags)}::jsonb,
        build_id = ${buildId},
        schema_version = ${SCHEMA_VERSION},
        updated_at = NOW()
      WHERE id = 1
    `;
  });

  if (audit) {
    await appendAuditLog(audit.action, patch as Record<string, unknown>, audit.adminId, audit.ip);
  }

  invalidateSystemConfigCache();
  const next = await getSystemConfig(true);
  emitSystemEvent(next);
  return next;
}

export async function appendAuditLog(
  action: string,
  payload: Record<string, unknown>,
  adminId: string,
  ip: string
) {
  await ensureSystemTables();
  await withDbRetry(async () => {
    const sql = db();
    await sql`
      INSERT INTO system_audit_logs (action, payload, admin_id, ip)
      VALUES (${action}, ${JSON.stringify(payload || {})}::jsonb, ${adminId.slice(0, 80)}, ${ip.slice(0, 64)})
    `;
  });
}

export async function listAuditLogs(limit = 50, action?: string): Promise<SystemAuditLog[]> {
  await ensureSystemTables();
  return withDbRetry(async () => {
    const sql = db();
    const lim = Math.min(100, Math.max(1, limit));
    let rows;
    if (action) {
      rows = await sql`
        SELECT id, action, payload, admin_id, ip, created_at
        FROM system_audit_logs WHERE action = ${action}
        ORDER BY id DESC LIMIT ${lim}
      `;
    } else {
      rows = await sql`
        SELECT id, action, payload, admin_id, ip, created_at
        FROM system_audit_logs ORDER BY id DESC LIMIT ${lim}
      `;
    }
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: Number(r.id),
      action: String(r.action),
      payload: (r.payload || {}) as Record<string, unknown>,
      adminId: String(r.admin_id || ""),
      ip: String(r.ip || ""),
      createdAt: String(r.created_at || ""),
    }));
  });
}

export async function isPanicOrFeatureBlocked(
  feature?: keyof FeatureFlags
): Promise<{ blocked: boolean; reason?: string; config: SystemConfig }> {
  const config = await getSystemConfig();
  if (config.panicLockdown) {
    return { blocked: true, reason: "EMERGENCY_LOCKDOWN", config };
  }
  if (feature && config.featureFlags[feature] === false) {
    return { blocked: true, reason: `FEATURE_OFF:${feature}`, config };
  }
  return { blocked: false, config };
}

/** SSE hub for system events */
type SysListener = (cfg: SystemConfig) => void;
const sysHub = new Set<SysListener>();

export function subscribeSystem(fn: SysListener): () => void {
  sysHub.add(fn);
  return () => {
    sysHub.delete(fn);
  };
}

function emitSystemEvent(cfg: SystemConfig) {
  for (const fn of sysHub) {
    try {
      fn(cfg);
    } catch {
      /* */
    }
  }
}

export async function waitSystemChange(
  afterIso: string,
  timeoutMs = 22000
): Promise<SystemConfig | null> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve(null);
    }, timeoutMs);
    const unsub = subscribeSystem((cfg) => {
      if (done) return;
      if (!afterIso || cfg.updatedAt > afterIso) {
        done = true;
        clearTimeout(timer);
        unsub();
        resolve(cfg);
      }
    });
  });
}

export async function createSnapshot(): Promise<Record<string, unknown>> {
  await ensureSystemTables();
  return withDbRetry(async () => {
    const sql = db();
    const config = await getSystemConfig(true);
    const users = await sql`
      SELECT id, username, uid, verified, role, created_at FROM users
      ORDER BY id DESC LIMIT 5000
    `;
    let keys: unknown[] = [];
    try {
      keys = await sql`
        SELECT id, code, tier, used_at, used_by, expires_at, revoked_at, created_at
        FROM activation_keys ORDER BY id DESC LIMIT 3000
      `;
    } catch {
      keys = [];
    }
    let eventStates: unknown[] = [];
    try {
      eventStates = await sql`
        SELECT user_id, username, coins, streak_days, version, updated_at
        FROM event_user_state ORDER BY user_id LIMIT 5000
      `;
    } catch {
      eventStates = [];
    }
    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
      config,
      users,
      keys,
      eventStates,
    };
  });
}

export async function getActivePatch(): Promise<
  (PatchCompensation & { claimedUsers: string[] }) | null
> {
  await ensureSystemTables();
  return withDbRetry(async () => {
    const sql = db();
    const rows = await sql`
      SELECT * FROM patch_compensations WHERE active = TRUE
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!rows.length) return null;
    const r = rows[0] as Record<string, unknown>;
    return {
      patchId: String(r.patch_id),
      title: String(r.title),
      body: String(r.body || ""),
      rewards: (r.rewards || {}) as PatchCompensation["rewards"],
      active: true,
      createdAt: String(r.created_at),
      claimedUsers: Array.isArray(r.claimed_users)
        ? (r.claimed_users as string[])
        : [],
    };
  });
}

export async function claimPatchReward(
  patchId: string,
  userId: number,
  username: string
): Promise<{ ok: boolean; error?: string; rewards?: PatchCompensation["rewards"] }> {
  await ensureSystemTables();
  return withDbRetry(async () => {
    const sql = db();
    const rows = await sql`
      SELECT * FROM patch_compensations WHERE patch_id = ${patchId} AND active = TRUE LIMIT 1
    `;
    if (!rows.length) return { ok: false, error: "Không có quà đền bù" };
    const r = rows[0] as Record<string, unknown>;
    const claimed = Array.isArray(r.claimed_users)
      ? [...(r.claimed_users as string[])]
      : [];
    const key = String(userId);
    if (claimed.includes(key) || claimed.includes(username)) {
      return { ok: false, error: "Đã nhận quà này rồi" };
    }
    claimed.push(key);
    await sql`
      UPDATE patch_compensations
      SET claimed_users = ${JSON.stringify(claimed)}::jsonb
      WHERE patch_id = ${patchId}
    `;
    const rewards = (r.rewards || {}) as PatchCompensation["rewards"];
    const coins = Number(rewards.coins || 0);
    if (coins > 0) {
      try {
        await sql`
          INSERT INTO event_user_state (user_id, username, coins, total_earned, version)
          VALUES (${userId}, ${username}, ${coins}, ${coins}, 1)
          ON CONFLICT (user_id) DO UPDATE SET
            coins = event_user_state.coins + ${coins},
            total_earned = event_user_state.total_earned + ${coins},
            version = event_user_state.version + 1,
            updated_at = NOW()
        `;
      } catch {
        /* */
      }
    }
    return { ok: true, rewards };
  });
}
