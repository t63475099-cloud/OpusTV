import { neon } from "@neondatabase/serverless";
import {
  computeExpiresAt,
  detectTier,
  generateKeyCode,
  isValidKeyFormat,
  mapRowToLicense,
  normalizeCustomPrefix,
  normalizeKeyCode,
  type KeyTier,
  type LicenseKeyRecord,
} from "@/lib/keyEngine";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

let ensured = false;

export async function ensureKeysTable() {
  if (ensured) return;
  const sql = db();
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
  // migrate columns if table existed without them
  await sql`ALTER TABLE activation_keys ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'CUSTOM'`;
  await sql`ALTER TABLE activation_keys ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`;
  await sql`CREATE INDEX IF NOT EXISTS activation_keys_code_idx ON activation_keys (code)`;
  await sql`CREATE INDEX IF NOT EXISTS activation_keys_tier_idx ON activation_keys (tier)`;
  ensured = true;
}

/** @deprecated dùng generateKeyCode từ keyEngine */
export function generateKeyCodeLegacy(): string {
  return generateKeyCode("24H");
}

export function normalizeKey(code: string): string {
  return normalizeKeyCode(code);
}

export async function createKeys(
  count: number,
  note = "",
  expiresDays?: number,
  opts?: {
    tier?: KeyTier;
    customPrefix?: string;
    customHours?: number;
  }
) {
  await ensureKeysTable();
  const sql = db();
  const n = Math.min(50, Math.max(1, Math.floor(count) || 1));
  const tier: KeyTier = opts?.tier || "24H";
  const codes: string[] = [];

  let expiresAt: Date | null = null;
  if (expiresDays != null && expiresDays > 0) {
    expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);
  } else {
    expiresAt = computeExpiresAt(tier, Date.now(), opts?.customHours);
  }

  for (let i = 0; i < n; i++) {
    let code = generateKeyCode(tier, opts?.customPrefix);
    for (let t = 0; t < 8; t++) {
      try {
        await sql`
          INSERT INTO activation_keys (code, expires_at, note, tier)
          VALUES (${code}, ${expiresAt}, ${note.slice(0, 120)}, ${tier})
        `;
        codes.push(code);
        break;
      } catch {
        code = generateKeyCode(tier, opts?.customPrefix);
      }
    }
  }
  return codes;
}

export async function validateKey(
  codeRaw: string
): Promise<{ ok: boolean; error?: string; tier?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKeyCode(codeRaw);
  if (!code || code.length < 8) {
    return { ok: false, error: "Mã kích hoạt không hợp lệ" };
  }
  if (!isValidKeyFormat(code) && !/^OF-/.test(code)) {
    return {
      ok: false,
      error: "Sai định dạng (24H-XXX-XXXXXXX / 12H-XXX-XXXXXXX / XX-XXX-XXXXXXX)",
    };
  }

  const rows = await sql`
    SELECT code, used_at, expires_at, revoked_at, tier
    FROM activation_keys WHERE code = ${code} LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Mã kích hoạt không tồn tại" };
  const row = rows[0] as {
    code: string;
    used_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    tier: string | null;
  };
  if (row.revoked_at) return { ok: false, error: "Mã đã bị thu hồi" };
  if (row.used_at) return { ok: false, error: "Mã đã được sử dụng" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Mã đã hết hạn" };
  }
  return { ok: true, tier: row.tier || detectTier(code) || undefined };
}

export async function consumeKey(
  codeRaw: string,
  username: string
): Promise<{ ok: boolean; error?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKeyCode(codeRaw);
  const rows = await sql`
    UPDATE activation_keys
    SET used_at = NOW(), used_by = ${username.slice(0, 40)}
    WHERE code = ${code}
      AND used_at IS NULL
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING code
  `;
  if (!rows.length) {
    return { ok: false, error: "Mã không dùng được (đã dùng / hết hạn / thu hồi / sai)" };
  }
  bumpKeysVersion();
  return { ok: true };
}

export async function revokeKey(codeRaw: string): Promise<{ ok: boolean; error?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKeyCode(codeRaw);
  const rows = await sql`
    UPDATE activation_keys
    SET revoked_at = NOW()
    WHERE code = ${code} AND revoked_at IS NULL
    RETURNING code
  `;
  if (!rows.length) return { ok: false, error: "Không thu hồi được (đã thu hồi hoặc không tồn tại)" };
  bumpKeysVersion();
  return { ok: true };
}

export async function unrevokeKey(codeRaw: string): Promise<{ ok: boolean; error?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKeyCode(codeRaw);
  const rows = await sql`
    UPDATE activation_keys
    SET revoked_at = NULL
    WHERE code = ${code} AND used_at IS NULL
    RETURNING code
  `;
  if (!rows.length) {
    return { ok: false, error: "Không mở khóa lại được (đã dùng hoặc không tồn tại)" };
  }
  bumpKeysVersion();
  return { ok: true };
}

export async function listKeys(opts?: {
  limit?: number;
  tier?: KeyTier | "ALL";
  status?: string;
}): Promise<LicenseKeyRecord[]> {
  await ensureKeysTable();
  const sql = db();
  const limit = Math.min(200, Math.max(1, opts?.limit || 80));
  const rows = await sql`
    SELECT id, code, created_at, expires_at, used_at, used_by, note, tier, revoked_at
    FROM activation_keys
    ORDER BY id DESC
    LIMIT ${limit}
  `;
  let list = (rows as Array<{
    id: number;
    code: string;
    created_at: string;
    expires_at: string | null;
    used_at: string | null;
    used_by: string | null;
    note: string | null;
    tier: string | null;
    revoked_at: string | null;
  }>).map(mapRowToLicense);

  if (opts?.tier && opts.tier !== "ALL") {
    list = list.filter((k) => k.tier === opts.tier);
  }
  if (opts?.status && opts.status !== "all") {
    list = list.filter((k) => k.status === opts.status);
  }
  return list;
}

export async function listRecentKeys(limit = 30) {
  return listKeys({ limit });
}

/** In-memory version for SSE polling */
let keysVersion = Date.now();
const sseWaiters: Array<() => void> = [];

export function bumpKeysVersion() {
  keysVersion = Date.now();
  while (sseWaiters.length) {
    const w = sseWaiters.shift();
    try {
      w?.();
    } catch {
      /* */
    }
  }
}

export function getKeysVersion() {
  return keysVersion;
}

export function waitKeysVersion(prev: number, timeoutMs = 25000): Promise<number> {
  if (keysVersion !== prev) return Promise.resolve(keysVersion);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const i = sseWaiters.indexOf(fn);
      if (i >= 0) sseWaiters.splice(i, 1);
      resolve(keysVersion);
    }, timeoutMs);
    const fn = () => {
      clearTimeout(timer);
      resolve(keysVersion);
    };
    sseWaiters.push(fn);
  });
}

export { normalizeCustomPrefix, generateKeyCode, type KeyTier, type LicenseKeyRecord };
