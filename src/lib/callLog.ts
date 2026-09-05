"use client";

import { useChatStore } from "@/lib/chatStore";

export type CallLogKind = "ended" | "rejected" | "missed" | "cancelled";
export type CallLogMode = "audio" | "video";

const PREFIX = "__CALL__|";

/** Tin hệ thống lịch sử gọi — đồng bộ qua sendMessage */
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

export function formatCallLogLabel(
  mode: CallLogMode,
  kind: CallLogKind,
  durationSec: number,
  mine: boolean
): string {
  const type = mode === "video" ? "Video" : "Thoại";
  if (kind === "ended") {
    const mm = String(Math.floor(durationSec / 60)).padStart(2, "0");
    const ss = String(durationSec % 60).padStart(2, "0");
    return `Cuộc gọi ${type.toLowerCase()} · ${mm}:${ss}`;
  }
  if (kind === "rejected") {
    return mine ? `Đã từ chối cuộc gọi ${type.toLowerCase()}` : `Cuộc gọi ${type.toLowerCase()} bị từ chối`;
  }
  if (kind === "cancelled") {
    return mine ? `Đã hủy cuộc gọi ${type.toLowerCase()}` : `Cuộc gọi ${type.toLowerCase()} đã hủy`;
  }
  // missed
  return mine ? `Cuộc gọi ${type.toLowerCase()} đi` : `Cuộc gọi ${type.toLowerCase()} nhỡ`;
}

/** Gửi lịch sử gọi vào đoạn chat với peer (username) */
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
