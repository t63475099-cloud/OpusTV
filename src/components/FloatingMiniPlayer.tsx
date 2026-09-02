"use client";

import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";

export default function FloatingMiniPlayer() {
  const path = usePathname();
  const router = useRouter();
  const track = useMusicPlayerStore((s) => s.track);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const stop = useMusicPlayerStore((s) => s.stop);

  if (!track || path?.startsWith("/nhac")) return null;

  function openFull() {
    if (!track) return;
    router.push(`/nhac?v=${encodeURIComponent(track.id)}`);
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/88 backdrop-blur-xl">
        {playing && (
          <button
            type="button"
            onClick={openFull}
            className="relative w-full aspect-video bg-black block text-left"
            aria-label="Mở bài đang phát"
          >
            <iframe
              key={track.id}
              title={track.title}
              src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          </button>
        )}
        <div className="flex items-center gap-2 p-2.5">
          <button type="button" onClick={openFull} className="shrink-0" aria-label="Mở bài đang phát">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.thumb || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
              alt=""
              className="w-11 h-11 rounded-lg object-cover bg-zinc-800"
            />
          </button>
          <button type="button" onClick={openFull} className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
            <p className="text-[11px] text-zinc-400 line-clamp-1">{track.artist}</p>
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-white/10 text-white"
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Tạm dừng" : "Phát"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            type="button"
            onClick={openFull}
            className="p-2 rounded-full hover:bg-white/10 text-white"
            aria-label="Mở Opus Music"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
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
