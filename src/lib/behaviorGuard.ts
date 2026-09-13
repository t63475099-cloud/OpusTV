/** Heuristic helpers for client-side behavior monitoring */

export type BehaviorSeverity = "low" | "medium" | "high" | "critical";

export type BehaviorEvent = {
  kind: string;
  detail: string;
  severity: BehaviorSeverity;
  meta?: Record<string, unknown>;
};

const SENSITIVE_LS_KEYS = [
  "opusfilm-event-coins",
  "opusfilm-watch-streak",
  "opusfilm-notifications",
  "opus-account",
  "opusfilm-account",
  "opusfilm-settings",
  "opusfilm-opus-pass",
];

export function readJsonLS(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return typeof p === "object" && p ? p : null;
  } catch {
    return null;
  }
}

export function extractCoins(store: Record<string, unknown> | null): number {
  if (!store) return 0;
  const state = (store.state as Record<string, unknown>) || store;
  return Math.floor(Number(state.coins) || 0);
}

export function extractStreak(store: Record<string, unknown> | null): number {
  if (!store) return 0;
  const state = (store.state as Record<string, unknown>) || store;
  return Math.floor(Number(state.current ?? state.streakDay) || 0);
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_LS_KEYS.some((k) => key.includes(k) || k.includes(key));
}

export function scoreSeverity(kind: string, jump?: number): BehaviorSeverity {
  if (kind === "coin_bug" && (jump || 0) >= 20000) return "critical";
  if (kind === "coin_bug" && (jump || 0) >= 5000) return "high";
  if (kind === "console_tamper") return "medium";
  if (kind === "third_party") return "high";
  if (kind === "false_complaint") return "high";
  if (kind === "storage_tamper") return "high";
  if (kind === "automation") return "medium";
  return "low";
}

export { SENSITIVE_LS_KEYS };
