"use client";

import { usePathname } from "next/navigation";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import Link from "next/link";

export default function FloatingMiniPlayer() {
  const path = usePathname();
  const track = useMusicPlayerStore((s) => s.track);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const stop = useMusicPlayerStore((s) => s.stop);

  // Ẩn khi đang ở trang nhạc (đã có player lớn)
  if (!track || path?.startsWith("/nhac")) return null;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,320px)]">
      <div className="lg-card lg-border-spin rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0c0c12]/90 backdrop-blur-xl">
        {playing && (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              key={track.id}
              title={track.title}
              src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <div className="flex items-center gap-2 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.thumb || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
            alt=""
            className="w-11 h-11 rounded-lg object-cover bg-zinc-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
            <p className="text-[11px] text-zinc-400 line-clamp-1">{track.artist}</p>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-white/10 text-white"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Tạm dừng" : "Phát"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <Link
            href="/nhac"
            className="p-2 rounded-full hover:bg-white/10 text-white"
            aria-label="Mở Opus Music"
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
            onClick={() => stop()}
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
