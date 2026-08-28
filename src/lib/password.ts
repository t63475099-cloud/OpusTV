import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function makeSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash token trước khi lưu DB — không lưu plain text */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
