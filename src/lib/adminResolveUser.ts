import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

/**
 * Tìm user theo UID (10 số kết bạn) ưu tiên, fallback username.
 */
export async function resolveUserByUidOrUsername(input: string): Promise<{
  id: number;
  username: string;
  uid: string | null;
} | null> {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const db = sql();

  // UID: chỉ số, thường 10 chữ số
  const digits = raw.replace(/\s/g, "");
  if (/^\d{6,12}$/.test(digits)) {
    try {
      const byUid = await db`
        SELECT id, username, uid FROM users WHERE uid = ${digits} LIMIT 1
      `;
      if (byUid.length) {
        const u = byUid[0] as { id: number; username: string; uid: string | null };
        return { id: u.id, username: u.username, uid: u.uid };
      }
    } catch {
      /* cột uid có thể chưa có trên DB cũ */
    }
  }

  const uname = raw.toLowerCase();
  const byName = await db`
    SELECT id, username, uid FROM users WHERE lower(username) = ${uname} LIMIT 1
  `;
  if (byName.length) {
    const u = byName[0] as { id: number; username: string; uid: string | null };
    return { id: u.id, username: u.username, uid: u.uid ?? null };
  }
  return null;
}
