import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

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
      note TEXT DEFAULT ''
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS activation_keys_code_idx ON activation_keys (code)`;
  ensured = true;
}

/** Mã dạng OF-XXXX-XXXX-XXXX */
export function generateKeyCode(): string {
  const raw = randomBytes(6).toString("hex").toUpperCase(); // 12 hex
  return `OF-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function normalizeKey(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function createKeys(count: number, note = "", expiresDays?: number) {
  await ensureKeysTable();
  const sql = db();
  const n = Math.min(50, Math.max(1, Math.floor(count) || 1));
  const codes: string[] = [];
  const expiresAt =
    expiresDays && expiresDays > 0
      ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
      : null;

  for (let i = 0; i < n; i++) {
    let code = generateKeyCode();
    for (let t = 0; t < 5; t++) {
      try {
        await sql`
          INSERT INTO activation_keys (code, expires_at, note)
          VALUES (${code}, ${expiresAt}, ${note.slice(0, 120)})
        `;
        codes.push(code);
        break;
      } catch {
        code = generateKeyCode();
      }
    }
  }
  return codes;
}

export async function validateKey(codeRaw: string): Promise<{ ok: boolean; error?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKey(codeRaw);
  if (!code || code.length < 8) return { ok: false, error: "Mã kích hoạt không hợp lệ" };

  const rows = await sql`
    SELECT code, used_at, expires_at FROM activation_keys WHERE code = ${code} LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Mã kích hoạt không tồn tại" };
  const row = rows[0] as { code: string; used_at: string | null; expires_at: string | null };
  if (row.used_at) return { ok: false, error: "Mã đã được sử dụng" };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "Mã đã hết hạn" };
  }
  return { ok: true };
}

/** Đánh dấu đã dùng — chỉ khi đăng ký thành công */
export async function consumeKey(codeRaw: string, username: string): Promise<{ ok: boolean; error?: string }> {
  await ensureKeysTable();
  const sql = db();
  const code = normalizeKey(codeRaw);
  const rows = await sql`
    UPDATE activation_keys
    SET used_at = NOW(), used_by = ${username.slice(0, 40)}
    WHERE code = ${code}
      AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    RETURNING code
  `;
  if (!rows.length) {
    return { ok: false, error: "Mã không dùng được (đã dùng / hết hạn / sai)" };
  }
  return { ok: true };
}

export async function listRecentKeys(limit = 30) {
  await ensureKeysTable();
  const sql = db();
  const rows = await sql`
    SELECT code, created_at, expires_at, used_at, used_by, note
    FROM activation_keys
    ORDER BY id DESC
    LIMIT ${Math.min(100, Math.max(1, limit))}
  `;
  return rows as {
    code: string;
    created_at: string;
    expires_at: string | null;
    used_at: string | null;
    used_by: string | null;
    note: string | null;
  }[];
}
