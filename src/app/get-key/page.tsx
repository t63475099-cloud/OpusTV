"use client";

import { useEffect } from "react";
import Link from "next/link";
import { KeyRound, ExternalLink, ArrowLeft } from "lucide-react";

/** Link vượt để nhận mã kích hoạt đăng ký */
const KEY_WALL_URL = "https://link4m.org/FBlS5LG8";

export default function GetKeyPage() {
  useEffect(() => {
    // Tự mở link vượt khi vào trang (tab mới); trang hiện tại vẫn hướng dẫn
    const t = window.setTimeout(() => {
      try {
        window.open(KEY_WALL_URL, "_blank", "noopener,noreferrer");
      } catch {
        /* ignore popup block */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

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
            Vượt link bên dưới để nhận mã kích hoạt, sau đó quay lại form đăng ký và dán mã vào ô Key.
          </p>
        </div>

        <a
          href={KEY_WALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition"
        >
          <ExternalLink className="w-4 h-4" />
          Mở link lấy Key
        </a>

        <p className="text-[11px] text-center text-slate-400 leading-relaxed">
          Nếu tab không tự mở, bấm nút phía trên. Sau khi có mã, quay lại trang Đăng ký và nhập vào ô Mã kích hoạt.
        </p>

        <Link
          href="/tai-khoan?mode=register"
          className="block text-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Đã có key → Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
