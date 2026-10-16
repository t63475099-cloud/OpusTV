"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { useHistoryStore } from "@/lib/history";
import { useAccountStore } from "@/lib/account";
import type { WatchHistory } from "@/lib/types";

function formatRemain(item: WatchHistory) {
  if (!item.duration || item.duration <= 0) return "";
  const left = Math.max(0, Math.floor(item.duration - item.currentTime));
  const m = Math.floor(left / 60);
  const s = left % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `Còn ${h}h${m % 60}p`;
  }
  return `Còn ${m}:${String(s).padStart(2, "0")}`;
}

export default function ContinueWatching() {
  const username = useAccountStore((s) => s.username);
  const owner = useHistoryStore((s) => s.owner);
  const history = useHistoryStore((s) => s.history);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Chỉ hiện khi đã đăng nhập và bucket đúng tài khoản
  const account = (username || "").trim().toLowerCase();
  const bound = (owner || "").trim().toLowerCase();
  if (!mounted || !account || !bound || account !== bound) return null;
  if (!history.length) return null;

  const items = history
    .filter((h) => {
      if (!h.duration || h.duration < 30) return h.currentTime > 10;
      const p = h.currentTime / h.duration;
      return p > 0.03 && p < 0.95;
    })
    .slice(0, 16);

  if (!items.length) return null;

  return (
    <section data-gsap-reveal data-gsap-row className="mb-8 md:mb-10 px-4 md:px-12">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-foreground md:text-xl">
        Tiếp tục xem
      </h2>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {items.map((item: WatchHistory) => {
          const progress =
            item.duration > 0
              ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
              : 0;
          const qs = new URLSearchParams();
          if (item.episodeSlug) qs.set("ep", item.episodeSlug);
          if (item.server) qs.set("server", item.server);
          const href = `/phim/${item.slug}${qs.toString() ? `?${qs}` : ""}`;

          return (
            <Link
              key={`${item.slug}-${item.episodeSlug}`}
              href={href}
              className="group relative w-[140px] flex-shrink-0 transition-transform duration-300 hover:scale-105 sm:w-[160px] md:w-[180px]"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-lg ui-border-contrast">
                <Image
                  src={item.poster || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90">
                    <Play className="ml-0.5 h-6 w-6 fill-primary-foreground text-primary-foreground" />
                  </div>
                </div>
                {progress > 0 ? (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                ) : null}
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Xem tiếp
                </span>
              </div>
              <div className="mt-2">
                <h3 className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">
                  {item.name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                  {item.episode}
                  {formatRemain(item) ? ` · ${formatRemain(item)}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
