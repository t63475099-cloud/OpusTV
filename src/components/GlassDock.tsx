"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
  section?: "film" | "chat" | "music" | "code" | "settings";
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
  return 0;
}

export default function GlassDock() {
  const path = usePathname() || "/";
  const router = useRouter();
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [lensX, setLensX] = useState(0);
  const [lensSize, setLensSize] = useState(56);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragOrigin = useRef({ pointerX: 0, lensX: 0 });
  const hide = shouldHideDock(path);

  useEffect(() => setMounted(true), []);
  useEffect(() => setIdx(activeIndex(path)), [path]);

  useEffect(() => {
    document.documentElement.dataset.dock = hide ? "0" : "1";
    return () => {
      document.documentElement.dataset.dock = "0";
    };
  }, [hide]);

  const measureLens = useCallback(() => {
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
    return mobile ? 56 : 68;
  }, []);

  const snapTo = useCallback(
    (i: number) => {
      const el = itemRefs.current[i];
      const dock = dockRef.current;
      if (!el || !dock) return;
      const size = measureLens();
      setLensSize(size);
      const dockRect = dock.getBoundingClientRect();
      const itemRect = el.getBoundingClientRect();
      const x = itemRect.left - dockRect.left + (itemRect.width - size) / 2;
      setLensX(Math.max(0, x));
      setIdx(i);
    },
    [measureLens]
  );

  useEffect(() => {
    if (hide || !mounted) return;
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
  }, [path, hide, mounted, snapTo]);

  const go = useCallback(
    (item: DockItem, i: number) => {
      snapTo(i);
      if (item.section) markEnterSection(item.section);
      router.push(item.href);
    },
    [router, snapTo]
  );

  const nearestIndex = useCallback((centerX: number) => {
    let best = 0;
    let bestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = r.left + r.width / 2;
      const d = Math.abs(c - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    // Phóng lens lớn hơn dock một chút khi kéo
    setLensSize(measureLens() + 12);
    dragOrigin.current = { pointerX: e.clientX, lensX };
    window.getSelection()?.removeAllRanges();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dockRef.current) return;
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    const rect = dockRef.current.getBoundingClientRect();
    const size = measureLens() + 12;
    const delta = e.clientX - dragOrigin.current.pointerX;
    let next = dragOrigin.current.lensX + delta;
    const max = Math.max(0, rect.width - size);
    next = Math.min(max, Math.max(-6, next));
    setLensX(next);

    // Highlight tab gần nhất khi kéo
    const center = rect.left + next + size / 2;
    const near = nearestIndex(center);
    setIdx(near);
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
    const rect = dock.getBoundingClientRect();
    const size = measureLens() + 12;
    const center = rect.left + lensX + size / 2;
    const best = nearestIndex(center);
    setLensSize(measureLens());
    go(ITEMS[best], best);
  };

  // Chuột di chuyển trên desktop (không cần giữ): lens theo hover
  const onItemEnter = (i: number) => {
    if (dragging) return;
    // Chỉ fine pointer
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      snapTo(i);
    }
  };

  if (!mounted || hide) return null;

  const dock = (
    <>
      <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden>
        <defs>
          <filter id="opus-dock-glass" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale={dragging ? 42 : 28} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <nav
        aria-label="Opus Dock"
        className={cn(
          "opus-glass-dock",
          "fixed z-[60] left-1/2 -translate-x-1/2",
          "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
          "pointer-events-none select-none"
        )}
        style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "none" }}
      >
        <div
          ref={dockRef}
          className={cn(
            "pointer-events-auto relative flex items-center justify-center",
            "gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2",
            "rounded-full",
            // overflow visible khi kéo để lens nhô ra
            dragging ? "overflow-visible" : "overflow-hidden",
            "border border-white/25",
            "bg-white/[0.12] backdrop-blur-xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
            "max-w-[min(100vw-1rem,520px)]",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Liquid lens — kéo được, phóng to, khúc xạ */}
          <div
            className={cn(
              "absolute top-1/2 z-[5] pointer-events-none",
              "rounded-[22px]",
              "border border-white/45",
              "bg-white/[0.18]",
              "shadow-[inset_0_0_20px_rgba(255,255,255,0.55),0_6px_24px_rgba(0,0,0,0.3)]",
              "backdrop-blur-[12px]",
              !dragging && "transition-[transform,width,height] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            )}
            style={{
              width: lensSize,
              height: lensSize,
              transform: `translate3d(${lensX}px, -50%, 0) scale(${dragging ? 1.12 : 1})`,
              filter: ready ? "url(#opus-dock-glass)" : undefined,
              opacity: ready ? 1 : 0,
            }}
          />

          {ITEMS.map((item, i) => {
            const active = i === idx;
            const underLens = active;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragging) go(item, i);
                }}
                onPointerEnter={() => onItemEnter(i)}
                className={cn(
                  "relative z-[2] flex flex-col items-center justify-center gap-0.5",
                  "min-w-[52px] sm:min-w-[64px] h-[52px] sm:h-[60px] px-1.5",
                  "rounded-2xl outline-none",
                  "transition-[opacity,transform,filter] duration-300 ease-out",
                  "cursor-pointer"
                )}
                style={{
                  opacity: underLens ? 1 : 0.5,
                  transform: underLens
                    ? `scale(${dragging ? 1.28 : 1.14}) skewX(${dragging ? -3 : -1.5}deg)`
                    : "scale(1)",
                  filter: underLens
                    ? "drop-shadow(0 0 12px rgba(255,255,255,0.5))"
                    : "none",
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
                    "relative z-[1] w-6 h-6 sm:w-7 sm:h-7 object-contain pointer-events-none",
                    !item.lightIcon && "brightness-0 invert"
                  )}
                />
                <span
                  className={cn(
                    "relative z-[1] text-[9px] sm:text-[10px] font-medium leading-none max-w-[64px] truncate",
                    underLens ? "text-white opacity-100" : "text-white/55 opacity-80"
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

  return createPortal(dock, document.body);
}
