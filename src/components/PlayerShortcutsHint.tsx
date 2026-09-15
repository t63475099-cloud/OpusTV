"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";

const ROWS = [
  ["Space", "Phát / Tạm dừng"],
  ["← →", "Tua ±5–30s (theo cài đặt)"],
  ["F", "Toàn màn hình"],
  ["M", "Tắt/bật tiếng"],
  ["0–9", "Nhảy % thời lượng (nếu hỗ trợ)"],
];

export default function PlayerShortcutsHint() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-full hover:bg-white/10 text-white/80 transition"
        title="Phím tắt"
        aria-label="Phím tắt"
      >
        <Keyboard className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-white/15 bg-black/90 backdrop-blur-xl p-3 text-xs text-zinc-300 shadow-xl z-40">
          <p className="font-semibold text-white mb-2">Phím tắt</p>
          <ul className="space-y-1.5">
            {ROWS.map(([k, v]) => (
              <li key={k} className="flex justify-between gap-2">
                <kbd className="text-sky-300 font-mono">{k}</kbd>
                <span className="text-right text-zinc-400">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
