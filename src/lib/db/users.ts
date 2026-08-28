import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function findUserByUsername(username: string) {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0] || null;
}

export async function createUser(username: string, password: string, recoveryPin?: string) {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const recoveryPinHash = recoveryPin ? await hashPassword(recoveryPin) : null;
  const inserted = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      recoveryPinHash,
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

export async function resetPasswordWithPin(
  username: string,
  recoveryPin: string,
  newPassword: string
) {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("Không tìm thấy tài khoản");
  if (!user.recoveryPinHash) {
    throw new Error("Tài khoản chưa đặt mã khôi phục — không thể đặt lại mật khẩu");
  }
  const pinOk = await verifyPassword(recoveryPin, user.recoveryPinHash);
  if (!pinOk) throw new Error("Mã khôi phục không đúng");
  if (newPassword.length < 6) throw new Error("Mật khẩu mới tối thiểu 6 ký tự");
  const passwordHash = await hashPassword(newPassword);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  return { username: user.username };
}

export async function setRecoveryPin(userId: number, recoveryPin: string) {
  if (!/^\d{4,8}$/.test(recoveryPin)) {
    throw new Error("Mã khôi phục phải là 4–8 chữ số");
  }
  const recoveryPinHash = await hashPassword(recoveryPin);
  const db = getDb();
  await db
    .update(users)
    .set({ recoveryPinHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
