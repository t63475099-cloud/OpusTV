"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Copy, Check, Loader2, ArrowLeft, UserPlus } from "lucide-react";

export default function GetKeyPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setBusy(true);
    setErr("");
    setCopied(false);
    try {
      const res = await fetch("/api/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Không tạo được mã");
        return;
      }
      setCode(data.code || (data.codes && data.codes[0]) || "");
    } catch {
      setErr("Lỗi mạng — thử lại");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      prompt("Sao chép mã:", code);
    }
  };

  return (
    <div className="lg-page min-h-[100dvh] pt-16 pb-24">
      <div className="lg-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 mx-auto max-w-md px-4">
        <Link
          href="/tai-khoan"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 mb-5 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng ký
        </Link>

        <div className="lg-card rounded-3xl p-6 sm:p-7 space-y-5 border border-white/10 shadow-2xl">
          <div className="text-center space-y-2">
            <span className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/40 to-rose-600/30 border border-amber-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(249,115,22,0.35)]">
              <KeyRound className="w-7 h-7 text-amber-300" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Get Key</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tạo mã kích hoạt ngẫu nhiên để đăng ký tài khoản OpusFilm
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => void generate()}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 active:scale-[0.98] transition disabled:opacity-50 shadow-lg shadow-orange-500/25"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...
              </span>
            ) : (
              "Tạo Key ngẫu nhiên"
            )}
          </button>

          {err && (
            <p className="text-sm text-amber-400 text-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              {err}
            </p>
          )}

          {code && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-amber-200/70 text-center">
                Mã kích hoạt của bạn
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-center text-lg sm:text-xl font-mono font-bold text-amber-100 tracking-widest break-all">
                  {code}
                </code>
                <button
                  type="button"
                  onClick={() => void copy()}
                  className="shrink-0 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
                  aria-label="Sao chép"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center">
                Mã dùng 1 lần · Hết hạn sau 7 ngày
              </p>
              <Link
                href={`/tai-khoan?mode=register&key=${encodeURIComponent(code)}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-100 transition"
              >
                <UserPlus className="w-4 h-4" />
                Dùng mã này để đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
