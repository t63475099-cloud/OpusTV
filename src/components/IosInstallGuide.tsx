"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  // iOS Safari
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone) return true;
  // display-mode
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Chrome/Firefox/Edge on iOS still use WebKit but have CriOS/FxiOS
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;
  return /Safari/.test(ua) || isIos();
}

/**
 * Hướng dẫn cài PWA trên iOS (Safari → Chia sẻ → Thêm vào Màn hình chính).
 * iOS không hỗ trợ beforeinstallprompt như Android/Chrome.
 */
export default function IosInstallGuide() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isIos() || isStandalone()) return;
    try {
      const dismissed = sessionStorage.getItem("opus-ios-install-dismiss");
      if (dismissed === "1") return;
    } catch {
      /* ignore */
    }
    // Hiện nút gợi ý sau vài giây
    const t = window.setTimeout(() => setShowFab(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    setShowFab(false);
    try {
      sessionStorage.setItem("opus-ios-install-dismiss", "1");
    } catch {
      /* ignore */
    }
  };

  if (!mounted || !showFab) return null;

  const panel = (
    <>
      {/* FAB góc dưới — không đè dock */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed z-[65] left-1/2 -translate-x-1/2",
            "px-4 py-2 rounded-full text-xs font-medium text-white",
            "bg-[#e11d48] border border-white/20 shadow-lg",
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          )}
          style={{
            bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
          }}
        >
          Cài OpusFilm trên màn hình chính
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={dismiss}
          />
          <div
            className={cn(
              "relative w-full max-w-sm rounded-3xl p-5",
              "bg-[#1c1c22]/95 backdrop-blur-2xl border border-white/20",
              "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
              "transition-all duration-500"
            )}
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute top-3 right-3 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/icon-192.png"
                alt=""
                className="w-14 h-14 rounded-2xl shadow-md"
              />
              <div>
                <p className="text-white font-semibold text-base">OpusFilm</p>
                <p className="text-zinc-400 text-xs">Cài lên màn hình iPhone / iPad</p>
              </div>
            </div>

            {!isSafari() && (
              <p className="text-amber-300/90 text-xs mb-3 leading-relaxed">
                Trên iOS hãy mở trang này bằng <strong>Safari</strong> (không dùng Chrome/Firefox) để thêm vào Màn hình chính.
              </p>
            )}

            <ol className="space-y-3 text-sm text-zinc-200">
              <li className="flex gap-3 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  1
                </span>
                <span className="pt-1 leading-snug">
                  Chạm nút <Share className="inline w-3.5 h-3.5 mx-0.5 text-sky-400" /> <strong>Chia sẻ</strong> trên thanh Safari (dưới hoặc trên màn hình).
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  2
                </span>
                <span className="pt-1 leading-snug">
                  Cuộn danh sách và chọn <Plus className="inline w-3.5 h-3.5 mx-0.5" /> <strong>Thêm vào Màn hình chính</strong>.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  3
                </span>
                <span className="pt-1 leading-snug">
                  Bấm <strong>Thêm</strong> — icon play đỏ OpusFilm sẽ xuất hiện trên màn hình chính.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full py-2.5 rounded-full bg-white/10 border border-white/15 text-sm text-white hover:bg-white/15 transition-colors duration-300"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
