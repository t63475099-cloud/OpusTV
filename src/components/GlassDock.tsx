"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
  section?: "film" | "chat" | "music" | "code" | "settings" | "portal";
  /** true = icon đã sáng sẵn, không invert */
  lightIcon?: boolean;
};

const ITEMS: DockItem[] = [
  { id: "home", href: "/home", label: "Trang chủ", icon: "/dock/home.png", section: "film" },
  { id: "chat", href: "/tin-nhan", label: "Trò chuyện", icon: "/dock/chat.png", section: "chat" },
  { id: "film", href: "/danh-sach/phim-moi-cap-nhat", label: "Xem phim", icon: "/dock/youtube.png", section: "film" },
  { id: "music", href: "/nhac", label: "Music", icon: "/dock/music.png", section: "music", lightIcon: true },
  { id: "code", href: "/code", label: "Code", icon: "/dock/code.png", section: "code" },
  { id: "settings", href: "/cai-dat", label: "Cài đặt", icon: "/dock/settings.png", section: "settings" },
];

function shouldHideDock(path: string): boolean {
  if (path === "/") return true;
  if (path.startsWith("/admin")) return true;
  if (path.startsWith("/bao-tri")) return true;
  if (path.startsWith("/get-key")) return true;
  if (path.startsWith("/phim/")) return true;
  if (path.startsWith("/tai-khoan")) return true;
  if (path.startsWith("/hop-thu")) return true;
  if (path.startsWith("/dieu-khoan") || path.startsWith("/chinh-sach")) return true;
  return false;
}

function activeIndex(path: string): number {
  if (path.startsWith("/tin-nhan")) return 1;
  if (path.startsWith("/danh-sach") || path.startsWith("/the-loai") || path.startsWith("/quoc-gia")) return 2;
  if (path.startsWith("/nhac")) return 3;
  if (path.startsWith("/code")) return 4;
  if (path.startsWith("/cai-dat")) return 5;
  if (
    path.startsWith("/home") ||
    path.startsWith("/yeu-thich") ||
    path.startsWith("/lich-su") ||
    path.startsWith("/xem-sau") ||
    path.startsWith("/tim-kiem") ||
    path.startsWith("/su-kien")
  ) {
    return 0;
  }
  return 0;
}

export default function GlassDock() {
  const path = usePathname() || "/";
  const router = useRouter();
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [lensX, setLensX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragOrigin = useRef({ pointerX: 0, lensX: 0 });

  const hide = shouldHideDock(path);

  useEffect(() => {
    setIdx(activeIndex(path));
  }, [path]);

  const snapTo = useCallback((i: number) => {
    const el = itemRefs.current[i];
    const dock = dockRef.current;
    if (!el || !dock) return;
    const dockRect = dock.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    const lensW = window.matchMedia("(min-width: 640px)").matches ? 76 : 64;
    const x = itemRect.left - dockRect.left + (itemRect.width - lensW) / 2;
    setLensX(Math.max(0, x));
    setIdx(i);
  }, []);

  useEffect(() => {
    if (hide) return;
    const run = () => {
      snapTo(activeIndex(path));
      setReady(true);
    };
    const id = requestAnimationFrame(run);
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", run);
    };
  }, [path, hide, snapTo]);

  // Body class for content padding
  useEffect(() => {
    if (hide) {
      document.documentElement.dataset.dock = "0";
      return;
    }
    document.documentElement.dataset.dock = "1";
    return () => {
      document.documentElement.dataset.dock = "0";
    };
  }, [hide]);

  const go = useCallback(
    (item: DockItem, i: number) => {
      snapTo(i);
      if (item.section) markEnterSection(item.section);
      router.push(item.href);
    },
    [router, snapTo]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    dragOrigin.current = { pointerX: e.clientX, lensX };
    window.getSelection()?.removeAllRanges();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dockRef.current) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    const rect = dockRef.current.getBoundingClientRect();
    const lensW = window.matchMedia("(min-width: 640px)").matches ? 76 : 64;
    const delta = e.clientX - dragOrigin.current.pointerX;
    let next = dragOrigin.current.lensX + delta;
    const max = Math.max(0, rect.width - lensW - 4);
    next = Math.min(max, Math.max(0, next));
    setLensX(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    const dock = dockRef.current;
    if (!dock) return;
    const dockRect = dock.getBoundingClientRect();
    const lensW = window.matchMedia("(min-width: 640px)").matches ? 76 : 64;
    const center = dockRect.left + lensX + lensW / 2;
    let best = 0;
    let bestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = r.left + r.width / 2;
      const d = Math.abs(c - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    go(ITEMS[best], best);
  };

  if (hide) return null;

  return (
    <>
      <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden>
        <defs>
          <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="28" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <nav
        aria-label="Opus Dock"
        className={cn(
          "fixed z-[60] left-1/2 -translate-x-1/2",
          "bottom-[max(0.65rem,env(safe-area-inset-bottom))] md:bottom-auto",
          "md:top-[max(4.35rem,calc(env(safe-area-inset-top)+3.35rem))]",
          "pointer-events-none select-none"
        )}
        style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "none" }}
      >
        <div
          ref={dockRef}
          className={cn(
            "pointer-events-auto relative flex items-end justify-center",
            "gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3",
            "rounded-full",
            "border-[1.5px] border-white/30",
            "bg-white/[0.12]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.28)]",
            "backdrop-blur-[6px]",
            "max-w-[min(100vw-0.75rem,560px)]"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className={cn(
              "absolute top-1/2 z-[5]",
              "w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-[20px] sm:rounded-[22px]",
              "border border-white/40",
              "bg-white/[0.14]",
              "shadow-[inset_0_0_18px_rgba(255,255,255,0.55),0_4px_20px_rgba(0,0,0,0.25)]",
              "backdrop-blur-[10px]",
              "pointer-events-none",
              !dragging && "transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            )}
            style={{
              transform: `translate3d(${lensX}px, -50%, 0)`,
              filter: ready ? "url(#glass-distortion)" : undefined,
              opacity: ready ? 1 : 0,
            }}
          />

          {ITEMS.map((item, i) => {
            const active = i === idx;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(item, i);
                }}
                className={cn(
                  "relative z-[2] flex flex-col items-center justify-center gap-0.5",
                  "w-14 h-14 sm:w-[76px] sm:h-[76px]",
                  "rounded-2xl outline-none",
                  "transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
                  "cursor-pointer"
                )}
                style={{
                  opacity: active ? 1 : 0.55,
                  transform: active ? "scale(1.1)" : "scale(1)",
                  filter: active ? "drop-shadow(0 0 10px rgba(255,255,255,0.4))" : "none",
                }}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.icon}
                  alt=""
                  draggable={false}
                  className={cn(
                    "w-7 h-7 sm:w-[42px] sm:h-[42px] object-contain pointer-events-none",
                    "transition-transform duration-500",
                    !item.lightIcon && "brightness-0 invert"
                  )}
                  style={{
                    transform: active ? "scale(1.18) skewX(-2deg)" : "scale(1)",
                  }}
                />
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-medium tracking-wide leading-none",
                    "transition-all duration-500 max-w-[72px] truncate",
                    active ? "opacity-100 text-white translate-y-0" : "opacity-0 sm:opacity-60 text-white/75"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
