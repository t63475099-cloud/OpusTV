"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldOff, MessageCircle, Clock } from "lucide-react";
import { BAN_DURATIONS, ZALO_SUPPORT, VIOLATION_LABELS, type ViolationKind } from "@/lib/moderation";

type BanInfo = {
  banned: boolean;
  level?: number;
  permanent?: boolean;
  banUntil?: string | null;
  reason?: string;
  kind?: string;
};

export default function BiKhoaPage() {
  const [info, setInfo] = useState<BanInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ban/status", { credentials: "include" });
        const data = await res.json();
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) setInfo({ banned: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const level = info?.level || 1;
  const meta = BAN_DURATIONS.find((b) => b.level === level) || BAN_DURATIONS[0];
  const kindLabel =
    info?.kind && info.kind in VIOLATION_LABELS
      ? VIOLATION_LABELS[info.kind as ViolationKind]
      : info?.kind || "Vi phạm chính sách";

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-rose-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-500/10 blur-[100px]" />
      </div>

      <div
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-5 transition-all duration-500 ease-out opacity-100 translate-y-0"
        style={{ animation: "fadeRise 0.5s ease-out" }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-rose-400" />
          </span>
          <h1 className="text-xl font-bold text-white">Tài khoản bị hạn chế</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Tài khoản của bạn đã bị khóa theo chính sách OpusFilm.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Mức khóa</span>
            <span className="text-rose-300 font-semibold">{meta.label}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Lý do</span>
            <span className="text-zinc-200 text-right max-w-[60%]">{kindLabel}</span>
          </div>
          {info?.reason ? (
            <p className="text-xs text-zinc-400 pt-1 border-t border-white/5">{info.reason}</p>
          ) : null}
          {!info?.permanent && info?.banUntil ? (
            <p className="text-xs text-amber-300/90 flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5" />
              Hết hạn: {new Date(info.banUntil).toLocaleString("vi-VN")}
            </p>
          ) : info?.permanent ? (
            <p className="text-xs text-rose-400 pt-1">Khóa vĩnh viễn · có thể kèm chặn IP thiết bị</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-400 leading-relaxed space-y-2">
          <p>Khiếu nại / hỗ trợ trực tiếp qua Zalo:</p>
          <a
            href={`https://zalo.me/${ZALO_SUPPORT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sky-400 font-semibold text-sm hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            {ZALO_SUPPORT}
          </a>
        </div>

        <Link
          href="/"
          className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition duration-500"
        >
          Về trang chủ
        </Link>
      </div>

      <style jsx>{`
        @keyframes fadeRise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
