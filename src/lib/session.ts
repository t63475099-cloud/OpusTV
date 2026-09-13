import { cookies } from "next/headers";
import { eq, and, gt, ne, desc, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { hashToken, makeSessionToken } from "@/lib/password";

export const SESSION_COOKIE = "opus_session";
const SESSION_DAYS = 30;

export type SessionDeviceMeta = {
  deviceName?: string;
  userAgent?: string;
  platform?: string;
};

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

/** Đảm bảo cột device trên bảng sessions (Neon) */
export async function ensureSessionDeviceColumns() {
  try {
    const db = getDb();
    await db.execute(sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_name text`);
    await db.execute(sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent text`);
    await db.execute(sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS platform text`);
  } catch {
    /* cột có thể đã có hoặc quyền hạn chế */
  }
}

export async function createSession(
  userId: number,
  device?: SessionDeviceMeta
): Promise<string> {
  const db = getDb();
  const token = makeSessionToken();
  const tokenHash = hashToken(token);
  await ensureSessionDeviceColumns();
  try {
    await db.insert(sessions).values({
      userId,
      sessionTokenHash: tokenHash,
      expiresAt: sessionExpiryDate(),
      deviceName: device?.deviceName?.slice(0, 120) || null,
      userAgent: device?.userAgent?.slice(0, 500) || null,
      platform: device?.platform?.slice(0, 64) || null,
    });
  } catch {
    // Fallback nếu cột chưa migrate
    await db.insert(sessions).values({
      userId,
      sessionTokenHash: tokenHash,
      expiresAt: sessionExpiryDate(),
    });
  }
  return token;
}

export async function destroySession(token: string) {
  if (!token) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.sessionTokenHash, hashToken(token)));
}

export async function resolveSessionToken(explicit?: string | null): Promise<string | null> {
  if (explicit && explicit.length > 10) return explicit;
  try {
    const jar = await cookies();
    const c = jar.get(SESSION_COOKIE)?.value;
    if (c) return c;
  } catch {
    /* */
  }
  return null;
}

export async function getSessionUserByToken(token: string | null | undefined) {
  if (!token) return null;
  try {
    const db = getDb();
    const tokenHash = hashToken(token);
    const rows = await db
      .select({
        userId: users.id,
        username: users.username,
        expiresAt: sessions.expiresAt,
        sessionId: sessions.id,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.sessionTokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return rows[0] || null;
  } catch (e) {
    // Retry 1 lần khi Neon cold
    try {
      await new Promise((r) => setTimeout(r, 500));
      const db = getDb();
      const tokenHash = hashToken(token!);
      const rows = await db
        .select({
          userId: users.id,
          username: users.username,
          expiresAt: sessions.expiresAt,
          sessionId: sessions.id,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(and(eq(sessions.sessionTokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
        .limit(1);
      return rows[0] || null;
    } catch {
      return null;
    }
  }
}

/** Cookie httpOnly HOẶC Authorization: Bearer / x-opus-session */
export async function getSessionUser(req?: { headers?: Headers | { get: (k: string) => string | null } }) {
  let token: string | null = null;
  try {
    if (req?.headers) {
      const h = req.headers;
      const auth = h.get("authorization") || h.get("Authorization") || "";
      if (auth.toLowerCase().startsWith("bearer ")) {
        token = auth.slice(7).trim();
      }
      if (!token) token = h.get("x-opus-session") || h.get("X-Opus-Session");
    }
  } catch {
    /* */
  }
  if (!token) token = await resolveSessionToken();
  return getSessionUserByToken(token);
}

export type SessionRow = {
  id: number;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  deviceName: string;
  platform: string;
  userAgent: string;
};

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return new Date(String(v)).toISOString();
}

/** Danh sách phiên còn hạn của user */
export async function listSessionsForUser(
  userId: number,
  currentToken?: string | null
): Promise<SessionRow[]> {
  const db = getDb();
  await ensureSessionDeviceColumns();
  const currentHash = currentToken ? hashToken(currentToken) : "";
  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      sessionTokenHash: sessions.sessionTokenHash,
      deviceName: sessions.deviceName,
      userAgent: sessions.userAgent,
      platform: sessions.platform,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));

  return rows.map((r, i) => {
    const name =
      (r.deviceName && String(r.deviceName).trim()) ||
      (r.platform && String(r.platform).trim()) ||
      `Thiết bị #${i + 1}`;
    return {
      id: r.id,
      createdAt: toIso(r.createdAt),
      expiresAt: toIso(r.expiresAt),
      isCurrent: !!currentHash && r.sessionTokenHash === currentHash,
      deviceName: name,
      platform: r.platform ? String(r.platform) : "",
      userAgent: r.userAgent ? String(r.userAgent) : "",
    };
  });
}

export async function revokeSessionById(userId: number, sessionId: number) {
  const db = getDb();
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.id, sessionId)));
}

export async function revokeOtherSessions(userId: number, currentToken: string) {
  const db = getDb();
  const currentHash = hashToken(currentToken);
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.sessionTokenHash, currentHash)));
}

export async function revokeAllSessions(userId: number) {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function cookieOptions(maxAgeSeconds: number) {
  // Render + Netlify đều HTTPS production
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "1" ||
    process.env.RENDER === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
