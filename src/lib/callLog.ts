"use client";

import { useChatStore } from "@/lib/chatStore";

export type CallLogKind = "ended" | "rejected" | "missed" | "cancelled";
export type CallLogMode = "audio" | "video";

const PREFIX = "__CALL__|";

export function encodeCallLog(
  mode: CallLogMode,
  kind: CallLogKind,
  durationSec = 0
): string {
  return `${PREFIX}${mode}|${kind}|${Math.max(0, Math.floor(durationSec))}`;
}

export function parseCallLog(text: string): {
  mode: CallLogMode;
  kind: CallLogKind;
  durationSec: number;
} | null {
  if (!text?.startsWith(PREFIX)) return null;
  const parts = text.slice(PREFIX.length).split("|");
  if (parts.length < 2) return null;
  const mode = parts[0] === "video" ? "video" : "audio";
  const kind = (["ended", "rejected", "missed", "cancelled"].includes(parts[1])
    ? parts[1]
    : "ended") as CallLogKind;
  const durationSec = Number(parts[2] || 0) || 0;
  return { mode, kind, durationSec };
}

/** Tiêu đề dòng phụ (Zalo: Bạn đã hủy) */
export function callLogTitle(kind: CallLogKind, mine: boolean): string {
  if (kind === "cancelled") return mine ? "Bạn đã hủy" : "Đối phương đã hủy";
  if (kind === "rejected") return mine ? "Bạn đã từ chối" : "Người nhận đã từ chối";
  if (kind === "missed") return mine ? "Cuộc gọi đi" : "Cuộc gọi nhỡ";
  return mine ? "Bạn đã gọi" : "Cuộc gọi đến";
}

export function formatCallLogLabel(
  mode: CallLogMode,
  kind: CallLogKind,
  durationSec: number,
  mine: boolean
): string {
  const type = mode === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại";
  if (kind === "ended") {
    const mm = String(Math.floor(durationSec / 60)).padStart(2, "0");
    const ss = String(durationSec % 60).padStart(2, "0");
    return `${type} · ${mm}:${ss}`;
  }
  return type;
}

export async function postCallLog(
  peerUsername: string | undefined | null,
  mode: CallLogMode,
  kind: CallLogKind,
  durationSec = 0
) {
  const peer = (peerUsername || "").trim().toLowerCase();
  if (!peer) return;
  try {
    const store = useChatStore.getState();
    if (!store.me) return;
    store.openDirect(peer);
    await store.sendMessage(encodeCallLog(mode, kind, durationSec));
  } catch {
    /* ignore */
  }
}
