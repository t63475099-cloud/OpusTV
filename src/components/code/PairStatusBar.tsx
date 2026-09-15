"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Check,
  Link2,
  Users,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  LogOut,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PairProgrammingApi } from "@/hooks/usePairProgramming";

type Props = {
  pair: PairProgrammingApi;
  displayName?: string;
  className?: string;
};

export default function PairStatusBar({
  pair,
  displayName = "Bạn",
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copyInvite = async () => {
    if (!pair.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(pair.inviteUrl);
      setCopied(true);
    } catch {
      /* */
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-xl border border-white/10",
        "bg-white/[0.04] backdrop-blur-xl text-[11px] text-zinc-300",
        "transition-all duration-500",
        className
      )}
    >
      {pair.status === "idle" ? (
        <>
          <button
            type="button"
            onClick={() => void pair.createRoom(displayName)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-medium transition-all duration-500"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tạo phòng cộng tác
          </button>
          <button
            type="button"
            onClick={() => setShowJoin((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-500"
          >
            <Link2 className="w-3.5 h-3.5" />
            Vào phòng
          </button>
          {showJoin && (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const id = joinInput.trim();
                if (!id) return;
                void pair.joinRoom(id, displayName);
                setShowJoin(false);
              }}
            >
              <input
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="opus-xxxxx hoặc URL"
                className="w-40 sm:w-52 px-2 py-1 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-rose-500/40"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-lg bg-sky-600/90 text-white"
              >
                Vào
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border",
              pair.connected
                ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                : "border-amber-500/30 text-amber-300 bg-amber-500/10"
            )}
          >
            {pair.connected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {pair.status === "joining"
              ? "Đang vào…"
              : pair.connected
                ? "Đã kết nối"
                : "Chờ peer…"}
          </span>

          {pair.roomId && (
            <span className="font-mono text-zinc-400 truncate max-w-[9rem]">
              {pair.roomId}
            </span>
          )}

          <div className="flex items-center -space-x-1.5">
            <span
              className="w-6 h-6 rounded-full border-2 border-[#121216] flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: "#f43f5e" }}
              title={displayName}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            {pair.peers.slice(0, 3).map((p) => (
              <span
                key={p.peerId}
                className="w-6 h-6 rounded-full border-2 border-[#121216] flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: p.color }}
                title={p.name}
              >
                {p.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
            <span className="ml-2 text-zinc-500 inline-flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {1 + pair.peers.length}
            </span>
          </div>

          {pair.pingMs != null && (
            <span className="text-zinc-500 tabular-nums">{pair.pingMs} ms</span>
          )}

          <button
            type="button"
            onClick={() => void copyInvite()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-500"
            title="Copy link mời"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Link
          </button>

          <button
            type="button"
            onClick={() => pair.setReadOnlyGuest(!pair.readOnly)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all duration-500",
              pair.readOnly
                ? "border-amber-500/40 text-amber-300"
                : "border-white/10 hover:bg-white/10"
            )}
            title="Khách chỉ xem"
          >
            {pair.readOnly ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            {pair.readOnly ? "Chỉ xem" : "Cùng sửa"}
          </button>

          <button
            type="button"
            onClick={() => pair.leaveRoom()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition-all duration-500"
          >
            <LogOut className="w-3 h-3" />
            Rời
          </button>
        </>
      )}

      {pair.error && (
        <span className="text-amber-400/90 text-[10px] max-w-[200px] truncate">
          {pair.error}
        </span>
      )}
    </div>
  );
}
