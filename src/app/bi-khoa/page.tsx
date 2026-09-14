"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldOff,
  Clock,
  FileText,
  LogOut,
  Send,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  BAN_DURATIONS,
  ZALO_SUPPORT,
  VIOLATION_LABELS,
  type ViolationKind,
} from "@/lib/moderation";
import { useAccountStore } from "@/lib/account";

type BanInfo = {
  banned: boolean;
  level?: number;
  permanent?: boolean;
  banUntil?: string | null;
  reason?: string;
  kind?: string;
  username?: string;
};

export default function BiKhoaPage() {
  const router = useRouter();
  const logout = useAccountStore((s) => s.logout);
  const username = useAccountStore((s) => s.username);

  const [info, setInfo] = useState<BanInfo | null>(null);
  const [showAppeal, setShowAppeal] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [accepted, setAccepted] = useState(false);

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

  async function submitAppeal() {
    setErr("");
    if (message.trim().length < 10) {
      setErr("Nội dung khiếu nại tối thiểu 10 ký tự");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/ban/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: message.trim(),
          contact: contact.trim(),
          username: username || info?.username || "",
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Không gửi được đơn");
        return;
      }
      setSent(true);
      setShowAppeal(false);
    } catch {
      setErr("Lỗi kết nối. Thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  async function acceptAndExit() {
    setBusy(true);
    try {
      await logout();
      try {
        sessionStorage.setItem(
          "opus_ban_notice",
          JSON.stringify({
            level,
            reason: info?.reason || kindLabel,
            permanent: !!info?.permanent,
            banUntil: info?.banUntil || null,
            at: Date.now(),
          })
        );
      } catch {
        /* */
      }
      setAccepted(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] min-h-[100svh] flex items-center justify-center px-3 sm:px-4 py-10 sm:py-16 relative overflow-hidden">
      {/* canvas glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-rose-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-sky-500/10 blur-[100px]" />
      </div>

      <div
        className="relative w-full max-w-[440px] sm:max-w-md rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-5 sm:p-8 space-y-4 sm:space-y-5 transition-all duration-500 ease-out"
        style={{ animation: "banFade 0.5s ease-out" }}
      >
        <div className="flex flex-col items-center text-center gap-2.5 sm:gap-3">
          <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center">
            <ShieldOff className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400" />
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Tài khoản bị khóa
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[92%]">
            Tài khoản của bạn đã bị hạn chế theo chính sách OpusFilm. Xem lý do bên dưới
            và chọn khiếu nại hoặc chấp nhận.
          </p>
        </div>

        {/* Chi tiết khóa */}
        <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5 sm:p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3 items-start">
            <span className="text-zinc-500 shrink-0 text-xs sm:text-sm">Mức khóa</span>
            <span className="text-rose-300 font-semibold text-right text-xs sm:text-sm">
              {meta.label}
            </span>
          </div>
          <div className="flex justify-between gap-3 items-start">
            <span className="text-zinc-500 shrink-0 text-xs sm:text-sm">Lý do</span>
            <span className="text-zinc-200 text-right max-w-[65%] text-xs sm:text-sm leading-snug">
              {kindLabel}
            </span>
          </div>
          {info?.reason ? (
            <p className="text-[11px] sm:text-xs text-zinc-400 pt-2 border-t border-white/5 leading-relaxed">
              Chi tiết: {info.reason}
            </p>
          ) : null}
          {!info?.permanent && info?.banUntil ? (
            <p className="text-[11px] sm:text-xs text-amber-300/90 flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Hết hạn: {new Date(info.banUntil).toLocaleString("vi-VN")}
            </p>
          ) : info?.permanent ? (
            <p className="text-[11px] sm:text-xs text-rose-400 pt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Khóa vĩnh viễn · có thể kèm chặn IP thiết bị
            </p>
          ) : null}
        </div>

        {sent && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-xs sm:text-sm text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Đã gửi đơn khiếu nại. Admin sẽ xem xét. Bạn vẫn không thể dùng tài khoản
              cho đến khi được gỡ khóa.
            </span>
          </div>
        )}

        {accepted && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs sm:text-sm text-amber-100 leading-relaxed">
            Đã đăng xuất. Khi đăng nhập lại, hệ thống sẽ tiếp tục hiển thị thông báo khóa
            và từ chối đăng nhập cho đến khi hết hạn hoặc admin gỡ khóa.
          </div>
        )}

        {/* Form khiếu nại */}
        {showAppeal && !sent && (
          <div
            className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-3.5 sm:p-4 space-y-3 transition-all duration-500"
            style={{ animation: "banFade 0.4s ease-out" }}
          >
            <p className="text-xs sm:text-sm font-medium text-sky-200 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Đơn khiếu nại gửi admin
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Trình bày rõ lý do khiếu nại, hoàn cảnh, bằng chứng (nếu có)…"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500/60 transition duration-500 resize-y min-h-[100px]"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Zalo / SĐT liên hệ (tuỳ chọn)"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500/60 transition duration-500"
            />
            {err && <p className="text-xs text-rose-400">{err}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitAppeal()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold py-2.5 transition duration-500 disabled:opacity-50 active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                Gửi đơn
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setShowAppeal(false);
                  setErr("");
                }}
                className="sm:w-28 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm py-2.5 transition duration-500"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}

        {/* Hai lựa chọn chính */}
        {!accepted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              disabled={busy || sent}
              onClick={() => setShowAppeal(true)}
              className="order-1 sm:order-1 inline-flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-100 text-sm font-semibold py-3 px-3 transition duration-500 disabled:opacity-50 active:scale-[0.98]"
            >
              <FileText className="w-4 h-4 shrink-0" />
              Khiếu nại
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void acceptAndExit()}
              className="order-2 sm:order-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 text-zinc-200 text-sm font-semibold py-3 px-3 transition duration-500 disabled:opacity-50 active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Chấp nhận / Thoát
            </button>
          </div>
        )}

        {accepted && (
          <button
            type="button"
            onClick={() => router.replace("/tai-khoan")}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-sm text-zinc-200 py-3 transition duration-500"
          >
            Đến trang đăng nhập
          </button>
        )}

        <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center leading-relaxed">
          Hỗ trợ Zalo:{" "}
          <a
            href={`https://zalo.me/${ZALO_SUPPORT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline"
          >
            {ZALO_SUPPORT}
          </a>
          {" · "}
          Đơn sai sự thật có thể bị xử lý nặng hơn theo chính sách.
        </p>
      </div>

      <style jsx>{`
        @keyframes banFade {
          from {
            opacity: 0;
            transform: translateY(14px);
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
