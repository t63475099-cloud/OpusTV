"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  UserPlus,
} from "lucide-react";

/** Link vượt để nhận mã kích hoạt đăng ký */
const KEY_WALL_URL = "https://link4m.org/FBlS5LG8";
const STORAGE_OPENED = "opusfilm-key-wall-opened";
const STORAGE_CODE = "opusfilm-last-activation-key";

export default function GetKeyPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [wallOpened, setWallOpened] = useState(false);

  const claimKey = useCallback(async () => {
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
      const next = String(data.code || (data.codes && data.codes[0]) || "").trim();
      if (!next) {
        setErr("Máy chủ không trả mã");
        return;
      }
      setCode(next);
      try {
        localStorage.setItem(STORAGE_CODE, next);
      } catch {
        /* ignore */
      }
    } catch {
      setErr("Lỗi mạng — thử lại");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_OPENED) === "1") setWallOpened(true);
      const saved = localStorage.getItem(STORAGE_CODE);
      if (saved) setCode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  /** Khi quay lại tab sau khi vượt link → tự nhận key 1 lần */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (!wallOpened) return;
      if (code) return;
      void claimKey();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [wallOpened, code, claimKey]);

  const openWall = () => {
    setWallOpened(true);
    try {
      localStorage.setItem(STORAGE_OPENED, "1");
    } catch {
      /* ignore */
    }
    window.open(KEY_WALL_URL, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      prompt("Sao chép mã:", code);
    }
  };

  return (
    <div className="min-h-[100dvh] pt-16 pb-24 flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-5">
        <Link
          href="/tai-khoan?mode=register"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng ký
        </Link>

        <div className="text-center space-y-2">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
            <KeyRound className="w-7 h-7 text-white" />
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Get Key</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Bước 1: vượt link. Bước 2: nhận mã bên dưới rồi dán vào ô Key khi đăng ký.
          </p>
        </div>

        <button
          type="button"
          onClick={openWall}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition"
        >
          <ExternalLink className="w-4 h-4" />
          Mở link lấy Key
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void claimKey()}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo mã…
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 text-amber-600" />
              {code ? "Lấy mã mới" : "Tôi đã vượt xong — Hiện Key"}
            </>
          )}
        </button>

        {err ? (
          <p className="text-center text-xs text-red-500 leading-snug">{err}</p>
        ) : null}

        {/* Ô hiển thị + copy KEY */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-amber-700/80 text-center font-semibold">
            Mã kích hoạt của bạn
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={code}
              placeholder="Chưa có mã — vượt link rồi bấm Hiện Key"
              className="flex-1 h-12 rounded-xl border border-amber-200 bg-white px-3 text-center text-base sm:text-lg font-mono font-bold tracking-wider text-slate-900 outline-none placeholder:text-slate-400 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!code}
              className="shrink-0 h-12 w-12 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition"
              aria-label="Sao chép key"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {code ? (
            <p className="text-[11px] text-center text-amber-800/70">
              Mã dùng 1 lần · Hết hạn sau 7 ngày · Bấm icon để sao chép
            </p>
          ) : (
            <p className="text-[11px] text-center text-slate-400">
              Sau khi vượt link xong, bấm «Hiện Key» để nhận mã tại đây
            </p>
          )}
        </div>

        {code ? (
          <Link
            href={`/tai-khoan?mode=register&key=${encodeURIComponent(code)}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition"
          >
            <UserPlus className="w-4 h-4" />
            Dùng mã này để đăng ký
          </Link>
        ) : (
          <Link
            href="/tai-khoan?mode=register"
            className="block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Đã có key → Đăng ký ngay
          </Link>
        )}
      </div>
    </div>
  );
}
