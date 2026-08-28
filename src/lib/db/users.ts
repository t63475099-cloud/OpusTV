import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function findUserByUsername(username: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
}

export async function findUserByPhone(phone: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return rows[0] || null;
}

export async function createUser(username: string, password: string, phone?: string | null) {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      phone: phone || null,
      updatedAt: new Date(),
    })
    .returning({ id: users.id, username: users.username, createdAt: users.createdAt });
  return inserted[0];
}

export async function touchLastLogin(userId: number) {
  const db = getDb();
  await db
    .update(users)
    .set({ lastLogin: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function checkPassword(username: string, password: string) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function saveOtp(userId: number, otpPlain: string) {
  const db = getDb();
  const otpHash = await hashPassword(otpPlain);
  const now = new Date();
  const expires = new Date(now.getTime() + 5 * 60 * 1000);
  await db
    .update(users)
    .set({
      otpHash,
      otpExpires: expires,
      otpLastSent: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));
}

export async function verifyAndConsumeOtp(userId: number, otpPlain: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user?.otpHash || !user.otpExpires) return false;
  if (new Date(user.otpExpires).getTime() < Date.now()) return false;
  const ok = await verifyPassword(otpPlain, user.otpHash);
  if (!ok) return false;
  await db
    .update(users)
    .set({ otpHash: null, otpExpires: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return true;
}

export async function resetPasswordByUserId(userId: number, newPassword: string) {
  if (newPassword.length < 8) throw new Error("Mật khẩu mới tối thiểu 8 ký tự");
  const passwordHash = await hashPassword(newPassword);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, otpHash: null, otpExpires: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function setUserPhone(userId: number, phone: string) {
  const db = getDb();
  const existing = await findUserByPhone(phone);
  if (existing && existing.id !== userId) throw new Error("Số điện thoại đã được dùng");
  await db.update(users).set({ phone, updatedAt: new Date() }).where(eq(users.id, userId));
}

export function secondsUntilResend(lastSent: Date | null | undefined): number {
  if (!lastSent) return 0;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  const wait = 60 * 1000 - elapsed;
  return wait > 0 ? Math.ceil(wait / 1000) : 0;
}
