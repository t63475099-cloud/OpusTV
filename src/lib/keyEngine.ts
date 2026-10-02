/**
 * License key engine — crypto-safe, no ambiguous chars (0 O 1 I L).
 * Formats:
 *   24H-XXX-XXXXXXX
 *   12H-XXX-XXXXXXX
 *   XX-XXX-XXXXXXX  (custom 2-char prefix, e.g. VP, FR, AD)
 */

import { randomBytes } from "crypto";

/** A–Z / 2–9, loại 0 O 1 I L */
export const KEY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export type KeyTier = "24H" | "12H" | "CUSTOM";
export type KeyStatus = "active" | "used" | "revoked" | "expired";

export interface LicenseKeyRecord {
  id: number;
  keyCode: string;
  tier: KeyTier;
  status: KeyStatus;
  usedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  note: string;
  customPrefix?: string | null;
}

export function randomSegment(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  return out;
}

export function normalizeKeyCode(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

/** Regex chuẩn từng phân vùng */
export const KEY_REGEX = {
  "24H": /^24H-[2-9A-HJKMNP-Z]{3}-[2-9A-HJKMNP-Z]{7}$/,
  "12H": /^12H-[2-9A-HJKMNP-Z]{3}-[2-9A-HJKMNP-Z]{7}$/,
  CUSTOM: /^[2-9A-HJKMNP-Z]{2}-[2-9A-HJKMNP-Z]{3}-[2-9A-HJKMNP-Z]{7}$/,
  /** OF cũ vẫn chấp nhận khi validate */
  LEGACY: /^OF-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/,
} as const;

export function detectTier(code: string): KeyTier | "LEGACY" | null {
  const c = normalizeKeyCode(code);
  if (KEY_REGEX["24H"].test(c)) return "24H";
  if (KEY_REGEX["12H"].test(c)) return "12H";
  if (KEY_REGEX.LEGACY.test(c)) return "LEGACY";
  if (KEY_REGEX.CUSTOM.test(c) && !c.startsWith("24H-") && !c.startsWith("12H-")) {
    return "CUSTOM";
  }
  return null;
}

export function isValidKeyFormat(code: string): boolean {
  return detectTier(code) != null;
}

export function generateKeyCode(
  tier: KeyTier,
  customPrefix?: string
): string {
  const mid = randomSegment(3);
  const tail = randomSegment(7);
  if (tier === "24H") return `24H-${mid}-${tail}`;
  if (tier === "12H") return `12H-${mid}-${tail}`;
  const pref = normalizeCustomPrefix(customPrefix || "XX");
  return `${pref}-${mid}-${tail}`;
}

export function normalizeCustomPrefix(raw: string): string {
  const s = String(raw || "XX")
    .toUpperCase()
    .replace(/[^2-9A-HJKMNP-Z]/g, "")
    .slice(0, 2);
  if (s.length === 2 && s !== "24" && s !== "12") return s;
  // fallback an toàn
  return randomSegment(2);
}

/** Thời hạn key tính từ lúc tạo (giờ) */
export function tierExpiryHours(tier: KeyTier, customHours?: number): number {
  if (tier === "24H") return 24;
  if (tier === "12H") return 12;
  const h = Number(customHours);
  if (Number.isFinite(h) && h > 0 && h <= 24 * 365) return Math.floor(h);
  return 24 * 7; // custom mặc định 7 ngày
}

export function computeExpiresAt(
  tier: KeyTier,
  fromMs = Date.now(),
  customHours?: number
): Date {
  const hours = tierExpiryHours(tier, customHours);
  return new Date(fromMs + hours * 60 * 60 * 1000);
}

export function deriveStatus(row: {
  used_at?: string | null;
  usedAt?: string | null;
  revoked_at?: string | null;
  revokedAt?: string | null;
  expires_at?: string | null;
  expiresAt?: string | null;
}): KeyStatus {
  const used = row.used_at || row.usedAt;
  const revoked = row.revoked_at || row.revokedAt;
  const exp = row.expires_at || row.expiresAt;
  if (revoked) return "revoked";
  if (used) return "used";
  if (exp && new Date(exp).getTime() < Date.now()) return "expired";
  return "active";
}

export function mapRowToLicense(row: {
  id: number;
  code: string;
  tier?: string | null;
  note?: string | null;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by: string | null;
  revoked_at?: string | null;
}): LicenseKeyRecord {
  const code = row.code;
  let tier: KeyTier = "CUSTOM";
  const det = detectTier(code);
  if (det === "24H" || det === "12H" || det === "CUSTOM") tier = det;
  else if (row.tier === "24H" || row.tier === "12H" || row.tier === "CUSTOM") {
    tier = row.tier;
  }
  return {
    id: row.id,
    keyCode: code,
    tier,
    status: deriveStatus(row),
    usedBy: row.used_by,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    revokedAt: row.revoked_at || null,
    note: row.note || "",
    customPrefix: tier === "CUSTOM" ? code.split("-")[0] : null,
  };
}

/** Event name cho BroadcastChannel / localStorage sync */
export const KEY_SYNC_CHANNEL = "opus-keys-sync";
export const KEY_SYNC_STORAGE = "opus-keys-sync-ts";
