import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { randomInt } from "crypto";

async function ensureUidColumn() {
  try {
    const db = getDb();
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS users_uid_uidx ON users (uid)`);
  } catch {
    /* */
  }
}

/** UID ngẫu nhiên 10 chữ số, không trùng */
export function generateUid(): string {
  let s = "";
  for (let i = 0; i < 10; i++) s += String(randomInt(0, 10));
  if (s[0] === "0") s = String(randomInt(1, 10)) + s.slice(1);
  return s;
}

export async function findUserByUsername(username: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
}

export async function findUserByUid(uid: string) {
  await ensureUidColumn();
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  return rows[0] || null;
}

export async function createUser(username: string, password: string, recoveryPin: string) {
  await ensureUidColumn();
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const recoveryPinHash = await hashPassword(recoveryPin);
  let uid = generateUid();
  for (let i = 0; i < 8; i++) {
    const exists = await findUserByUid(uid);
    if (!exists) break;
    uid = generateUid();
  }
  const inserted = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      recoveryPinHash,
      uid,
      updatedAt: new Date(),
    } as typeof users.$inferInsert)
    .returning({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
      uid: users.uid,
    });
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

export async function resetPasswordWithPin(
  username: string,
  recoveryPin: string,
  newPassword: string
) {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("Không tìm thấy tài khoản");
  if (!user.recoveryPinHash) throw new Error("Tài khoản chưa có mã PIN");
  const pinOk = await verifyPassword(recoveryPin, user.recoveryPinHash);
  if (!pinOk) throw new Error("Mã PIN không đúng");
  if (newPassword.length < 8) throw new Error("Mật khẩu mới tối thiểu 8 ký tự");
  const passwordHash = await hashPassword(newPassword);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return { username: user.username };
}

export async function setRecoveryPin(userId: number, recoveryPin: string) {
  if (!/^\d{4,8}$/.test(recoveryPin)) throw new Error("Mã PIN phải là 4–8 chữ số");
  const recoveryPinHash = await hashPassword(recoveryPin);
  const db = getDb();
  await db
    .update(users)
    .set({ recoveryPinHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Gán UID nếu tài khoản cũ chưa có */
export async function ensureUserUid(userId: number): Promise<string | null> {
  await ensureUidColumn();
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const u = rows[0] as { uid?: string | null } | undefined;
  if (!u) return null;
  if (u.uid && /^\d{10}$/.test(u.uid)) return u.uid;
  let uid = generateUid();
  for (let i = 0; i < 8; i++) {
    if (!(await findUserByUid(uid))) break;
    uid = generateUid();
  }
  await db.update(users).set({ uid, updatedAt: new Date() } as never).where(eq(users.id, userId));
  return uid;
}
