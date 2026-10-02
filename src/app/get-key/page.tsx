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
  RefreshCw,
} from "lucide-react";

/** Link vượt để nhận mã kích hoạt đăng ký */
const KEY_WALL_URL = "https://link4m.org/FBlS5LG8";
const STORAGE_OPENED = "opusfilm-key-wall-opened";
const STORAGE_CODE = "opusfilm-last-activation-key";
const STORAGE_CLAIMED_AT = "opusfilm-key-claimed-at";

export default function GetKeyPage() {
  const [code, setCode] = useState("");
  const [tier, setTier] = useState("24H");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [wallOpened, setWallOpened] = useState(false);
  const [hint, setHint] = useState("");

  const claimKey = useCallback(async (force = false) => {
    setBusy(true);
    setErr("");
    setCopied(false);
    setHint("");
    try {
      // Rate-limit client: 1 key / 2 phút (tránh spam)
      if (!force) {
        try {
          const last = Number(localStorage.getItem(STORAGE_CLAIMED_AT) || 0);
          if (last && Date.now() - last < 120_000) {
            const wait = Math.ceil((120_000 - (Date.now() - last)) / 1000);
            setErr(`Chờ ${wait}s trước khi lấy mã mới`);
            setBusy(false);
            return;
          }
        } catch {
          /* */
        }
      }

      const res = await fetch("/api/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "get-key" }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErr(data.error || `Không tạo được mã (${res.status})`);
        return;
      }
      const next = String(data.code || (data.codes && data.codes[0]) || "").trim();
      if (!next) {
        setErr("Máy chủ không trả mã — thử lại");
        return;
      }
      setCode(next);
      setTier(String(data.tier || "24H"));
      setExpiresInHours(Number(data.expiresInHours) || 24);
      setHint("Đã nhận mã. Sao chép rồi dán vào form đăng ký.");
      try {
        localStorage.setItem(STORAGE_CODE, next);
        localStorage.setItem(STORAGE_CLAIMED_AT, String(Date.now()));
      } catch {
        /* */
      }
    } catch {
      setErr("Lỗi mạng — kiểm tra kết nối rồi thử lại");
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
      /* */
    }
  }, []);

  /** Quay lại tab sau khi vượt link → tự nhận key 1 lần nếu chưa có */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      if (!wallOpened) return;
      if (code) return;
      void claimKey(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [wallOpened, code, claimKey]);

  const openWall = () => {
    setWallOpened(true);
    setErr("");
    try {
      localStorage.setItem(STORAGE_OPENED, "1");
    } catch {
      /* */
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
    <div className="min-h-[100dvh] pt-16 pb-28 flex items-center justify-center px-4 bg-[#0a0a0f]">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40 p-6 sm:p-8 space-y-5">
        <Link
          href="/tai-khoan?mode=register"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng ký
        </Link>

        <div className="text-center space-y-2">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <KeyRound className="w-7 h-7 text-white" />
          </span>
          <h1 className="text-xl font-bold text-zinc-50 tracking-tight">Get Key</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Bước 1: mở link vượt. Bước 2: nhận mã dạng{" "}
            <span className="font-mono text-amber-400/90">24H-XXX-XXXXXXX</span> rồi dán vào
            đăng ký.
          </p>
        </div>

        <ol className="text-xs text-zinc-500 space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
          <li>1. Bấm «Mở link lấy Key» và hoàn thành bước vượt.</li>
          <li>2. Quay lại trang này — mã hiện tự động (hoặc bấm «Hiện Key»).</li>
          <li>3. Copy mã → Đăng ký tài khoản.</li>
        </ol>

        <button
          type="button"
          onClick={openWall}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition"
        >
          <ExternalLink className="w-4 h-4" />
          Mở link lấy Key
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void claimKey(false)}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 text-sm font-semibold transition disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo mã…
            </>
          ) : (
            <>
              {code ? <RefreshCw className="w-4 h-4 text-amber-400" /> : <KeyRound className="w-4 h-4 text-amber-400" />}
              {code ? "Lấy mã mới" : "Tôi đã vượt xong — Hiện Key"}
            </>
          )}
        </button>

        {err ? (
          <p className="text-center text-xs text-rose-400 leading-snug">{err}</p>
        ) : null}
        {hint && !err ? (
          <p className="text-center text-xs text-emerald-400 leading-snug">{hint}</p>
        ) : null}

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-amber-400/80 text-center font-semibold">
            Mã kích hoạt · {tier}
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={code}
              placeholder="Chưa có mã — vượt link rồi bấm Hiện Key"
              className="flex-1 h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-center text-base sm:text-lg font-mono font-bold tracking-wider text-zinc-50 outline-none placeholder:text-zinc-600 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
            />
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!code}
              className="shrink-0 h-12 w-12 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 flex items-center justify-center transition"
              aria-label="Sao chép key"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {code ? (
            <p className="text-[11px] text-center text-amber-200/60">
              Dùng 1 lần · Hết hạn sau {expiresInHours}h · Bấm icon để sao chép
            </p>
          ) : (
            <p className="text-[11px] text-center text-zinc-500">
              Sau khi vượt link, bấm «Hiện Key» để nhận mã tại đây
            </p>
          )}
        </div>

        {code ? (
          <Link
            href={`/tai-khoan?mode=register&key=${encodeURIComponent(code)}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition"
          >
            <UserPlus className="w-4 h-4" />
            Dùng mã này để đăng ký
          </Link>
        ) : (
          <Link
            href="/tai-khoan?mode=register"
            className="block text-center text-sm font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Đã có key → Đăng ký ngay
          </Link>
        )}
      </div>
    </div>
  );
}
