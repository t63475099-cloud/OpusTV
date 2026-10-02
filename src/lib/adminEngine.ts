/**
 * Master Admin Engine — types & helpers for /admin/board-home
 * Zero mock data. All records come from Neon via API.
 */

import { randomBytes } from "crypto";
import {
  generateKeyCode,
  normalizeCustomPrefix,
  type KeyTier,
  type KeyStatus,
  type LicenseKeyRecord,
} from "@/lib/keyEngine";

export type { KeyTier, KeyStatus, LicenseKeyRecord };

export type AdminRole = "User" | "VIP" | "Admin";
export type AccountStatus = "active" | "banned";

export interface AdminAccount {
  id: number;
  username: string;
  uid: string | null;
  email: string | null;
  role: AdminRole;
  verified: boolean;
  status: AccountStatus;
  banReason: string | null;
  banUntil: string | null;
  createdAt: string;
  lastLogin: string | null;
  expiresAt: string | null;
}

export interface VerifyRequestItem {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  field: string;
  socialLink: string;
  status: string;
  verified: boolean;
  createdAt: string;
}

export interface SystemStats {
  users: number;
  keysActive: number;
  keysTotal: number;
  pendingVerify: number;
  bansActive: number;
  sessions: number;
  serverTime: string;
}

export type BoardSection = "accounts" | "keys" | "verify" | "system";

export type BoardAction =
  | "list"
  | "create_account"
  | "reset_password"
  | "ban"
  | "unban"
  | "delete_account"
  | "generate_keys"
  | "revoke_key"
  | "unrevoke_key"
  | "delete_key"
  | "approve_verify"
  | "reject_verify"
  | "delete_verify"
  | "purge_ai_metadata"
  | "purge_ai_cache"
  | "clean_orphans"
  | "stats";

/** Alphabet an toàn (đã loại 0 O 1 I L) — re-export */
export { KEY_ALPHABET, generateKeyCode, normalizeCustomPrefix } from "@/lib/keyEngine";

export function randomAdminPin(len = 6): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += String(bytes[i] % 10);
  return out;
}

export function normalizeRole(raw: unknown): AdminRole {
  const s = String(raw || "User").trim();
  if (s === "VIP" || s === "vip") return "VIP";
  if (s === "Admin" || s === "admin" || s === "SUPER_ADMIN") return "Admin";
  return "User";
}

export function isAdminSecretValid(headerValue: string | null | undefined): boolean {
  const provided = String(headerValue || "").trim();
  if (!provided) return false;
  const candidates = [
    process.env.ADMIN_SECRET,
    process.env.VERIFY_ADMIN_SECRET,
    process.env.KEY_ADMIN_SECRET,
    process.env.MIGRATE_SECRET,
    process.env.REDEEM_ADMIN_SECRET,
  ].filter(Boolean) as string[];
  if (candidates.length === 0) {
    // Dev fallback only when no env set — still require non-empty match to known default
    return provided === "OpusFilm2026Secret";
  }
  return candidates.some((c) => c === provided);
}

export function adminSecretFromRequest(headers: Headers, searchParams?: URLSearchParams): string {
  return (
    headers.get("x-admin-secret") ||
    headers.get("x-key-secret") ||
    searchParams?.get("secret") ||
    ""
  );
}
