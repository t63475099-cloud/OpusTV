import { cookies } from "next/headers";
import { eq, and, gt, ne, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { hashToken, makeSessionToken } from "@/lib/password";

export const SESSION_COOKIE = "opus_session";
const SESSION_DAYS = 30;

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const token = makeSessionToken();
  const tokenHash = hashToken(token);
  await db.insert(sessions).values({
    userId,
    sessionTokenHash: tokenHash,
    expiresAt: sessionExpiryDate(),
  });
  return token;
}

export async function destroySession(token: string) {
  if (!token) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.sessionTokenHash, hashToken(token)));
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
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
  } catch {
    return null;
  }
}

export type SessionRow = {
  id: number;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

/** Danh sách phiên còn hạn của user */
export async function listSessionsForUser(
  userId: number,
  currentToken?: string | null
): Promise<SessionRow[]> {
  const db = getDb();
  const currentHash = currentToken ? hashToken(currentToken) : "";
  const rows = await db
    .select({
      id: sessions.id,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      sessionTokenHash: sessions.sessionTokenHash,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    createdAt: (r.createdAt instanceof Date
      ? r.createdAt
      : new Date(r.createdAt as string)
    ).toISOString(),
    expiresAt: (r.expiresAt instanceof Date
      ? r.expiresAt
      : new Date(r.expiresAt as string)
    ).toISOString(),
    isCurrent: !!currentHash && r.sessionTokenHash === currentHash,
  }));
}

/** Thu hồi 1 phiên (chỉ của chính user) */
export async function revokeSessionById(userId: number, sessionId: number) {
  const db = getDb();
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.id, sessionId)));
}

/** Thu hồi mọi phiên khác, giữ phiên hiện tại */
export async function revokeOtherSessions(userId: number, currentToken: string) {
  const db = getDb();
  const currentHash = hashToken(currentToken);
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.sessionTokenHash, currentHash)));
}

/** Thu hồi toàn bộ phiên của user (đăng xuất mọi nơi) */
export async function revokeAllSessions(userId: number) {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function cookieOptions(maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
