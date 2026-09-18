"use client";

import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { useMusicSleepStore } from "@/lib/musicSleep";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";

const PRESETS = [5, 15, 30, 45, 60];

export default function MusicSleepTimer() {
  const endsAt = useMusicSleepStore((s) => s.endsAt);
  const minutes = useMusicSleepStore((s) => s.minutes);
  const setMinutes = useMusicSleepStore((s) => s.setMinutes);
  const tick = useMusicSleepStore((s) => s.tick);
  const [left, setLeft] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      if (tick()) {
        try {
          useMusicPlayerStore.getState().pause?.();
        } catch {
          /* */
        }
        // stop youtube via postMessage if needed
        try {
          const iframes = document.querySelectorAll("iframe");
          iframes.forEach((f) => {
            (f as HTMLIFrameElement).contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
              "*"
            );
          });
        } catch {
          /* */
        }
      }
      const e = useMusicSleepStore.getState().endsAt;
      if (!e) {
        setLeft("");
        return;
      }
      const sec = Math.max(0, Math.ceil((e - Date.now()) / 1000));
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      setLeft(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <Moon className="w-3.5 h-3.5 text-zinc-400" />
      <span className="text-zinc-500">Hẹn giờ tắt</span>
      {PRESETS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMinutes(minutes === m ? null : m)}
          className={`px-2 py-1 rounded-full border transition ${
            minutes === m
              ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
              : "border-white/10 text-zinc-400 hover:bg-white/5"
          }`}
        >
          {m}p
        </button>
      ))}
      {left ? <span className="text-violet-300 tabular-nums ml-1">còn {left}</span> : null}
      {endsAt ? (
        <button type="button" className="text-zinc-500 underline ml-1" onClick={() => setMinutes(null)}>
          Hủy
        </button>
      ) : null}
    </div>
  );
}
