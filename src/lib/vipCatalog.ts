/**
 * 11 VIP tiers — shared by shop, license keys, admin Key-board.
 * No marketing copy. Durations in seconds.
 */

export type VipTierCode =
  | "24H"
  | "3D"
  | "7D"
  | "15D"
  | "1M"
  | "3M"
  | "6M"
  | "1Y"
  | "3Y"
  | "10Y"
  | "LIFETIME";

export interface VipTierDef {
  code: VipTierCode;
  label: string;
  /** seconds to add; 0 = lifetime */
  durationSec: number;
  coinPrice: number;
  isLifetime: boolean;
  /** segment used in OPUS-<SEG>-XXXXXXXX */
  keySegment: string;
}

export const VIP_TIERS: VipTierDef[] = [
  { code: "24H", label: "Gói 24 Giờ", durationSec: 86400, coinPrice: 100, isLifetime: false, keySegment: "24H" },
  { code: "3D", label: "Gói 3 Ngày", durationSec: 259200, coinPrice: 250, isLifetime: false, keySegment: "3D" },
  { code: "7D", label: "Gói 7 Ngày", durationSec: 604800, coinPrice: 500, isLifetime: false, keySegment: "7D" },
  { code: "15D", label: "Gói 15 Ngày", durationSec: 1296000, coinPrice: 950, isLifetime: false, keySegment: "15D" },
  { code: "1M", label: "Gói 1 Tháng", durationSec: 2592000, coinPrice: 1600, isLifetime: false, keySegment: "1M" },
  { code: "3M", label: "Gói 3 Tháng", durationSec: 7776000, coinPrice: 4200, isLifetime: false, keySegment: "3M" },
  { code: "6M", label: "Gói 6 Tháng", durationSec: 15552000, coinPrice: 7500, isLifetime: false, keySegment: "6M" },
  { code: "1Y", label: "Gói 1 Năm", durationSec: 31536000, coinPrice: 13500, isLifetime: false, keySegment: "1Y" },
  { code: "3Y", label: "Gói 3 Năm", durationSec: 94608000, coinPrice: 32000, isLifetime: false, keySegment: "3Y" },
  { code: "10Y", label: "Gói 10 Năm", durationSec: 315360000, coinPrice: 80000, isLifetime: false, keySegment: "10Y" },
  { code: "LIFETIME", label: "Gói Vĩnh Viễn", durationSec: 0, coinPrice: 160000, isLifetime: true, keySegment: "LIFE" },
];

export function getVipTier(code: string): VipTierDef | null {
  const c = String(code || "").toUpperCase();
  return VIP_TIERS.find((t) => t.code === c || t.keySegment === c) || null;
}

/** Stack duration onto current expiry (ms). Lifetime → flag only. */
export function stackVipExpiry(
  currentExpiresAtMs: number | null,
  tier: VipTierDef,
  now = Date.now()
): { expiresAtMs: number | null; isLifetime: boolean } {
  if (tier.isLifetime) {
    return { expiresAtMs: null, isLifetime: true };
  }
  const base = Math.max(now, currentExpiresAtMs || 0);
  return { expiresAtMs: base + tier.durationSec * 1000, isLifetime: false };
}

export function isVipActive(opts: {
  isLifetime?: boolean | null;
  expiresAtMs?: number | null;
  expiresAtIso?: string | null;
  now?: number;
}): boolean {
  if (opts.isLifetime) return true;
  const now = opts.now ?? Date.now();
  let exp = opts.expiresAtMs ?? null;
  if (exp == null && opts.expiresAtIso) {
    const t = Date.parse(opts.expiresAtIso);
    exp = Number.isFinite(t) ? t : null;
  }
  return exp != null && exp > now;
}

export function formatVipRemaining(ms: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

/** OPUS-24H-9A8F1B2C style */
export const OPUS_KEY_REGEX =
  /^OPUS-(24H|3D|7D|15D|1M|3M|6M|1Y|3Y|10Y|LIFE)-[0-9A-F]{8}$/i;

export function parseOpusKeyTier(code: string): VipTierCode | null {
  const m = String(code || "")
    .trim()
    .toUpperCase()
    .match(/^OPUS-(24H|3D|7D|15D|1M|3M|6M|1Y|3Y|10Y|LIFE)-[0-9A-F]{8}$/);
  if (!m) return null;
  return m[1] === "LIFE" ? "LIFETIME" : (m[1] as VipTierCode);
}
