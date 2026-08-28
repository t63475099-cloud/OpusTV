import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
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
