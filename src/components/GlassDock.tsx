"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
  section?: "film" | "chat" | "music" | "code" | "settings" | "pass" | "account";
};

const ITEMS: DockItem[] = [
  { id: "home", href: "/home", label: "Trang chủ", icon: "/dock/home.png", section: "film" },
  { id: "chat", href: "/tin-nhan", label: "Trò chuyện", icon: "/dock/chat.png", section: "chat" },
  { id: "film", href: "/danh-sach/phim-moi-cap-nhat", label: "Xem phim", icon: "/dock/youtube.png", section: "film" },
  { id: "music", href: "/nhac", label: "Music", icon: "/dock/music.png", section: "music" },
  { id: "code", href: "/code", label: "Code", icon: "/dock/code.png", section: "code" },
  { id: "event", href: "/su-kien", label: "Sự kiện", icon: "/dock/event.png", section: "pass" },
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
  if (path.startsWith("/su-kien")) return 5;
  if (path.startsWith("/cai-dat")) return 6;
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
  const [lensW, setLensW] = useState(56);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const dragOrigin = useRef({ pointerX: 0, lensX: 0 });
  const moved = useRef(false);
  const hide = shouldHideDock(path);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.dataset.dock = hide ? "0" : "1";
    return () => {
      document.documentElement.dataset.dock = "0";
    };
  }, [hide]);

  /** Căn lens đúng tâm nút i — 1 lớp duy nhất */
  const placeLensOn = useCallback((i: number, grow = false) => {
    const el = itemRefs.current[i];
    const dock = dockRef.current;
    if (!el || !dock) return;
    const dockRect = dock.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    const base = Math.min(itemRect.width, itemRect.height) - 4;
    const size = grow ? base + 14 : base;
    const x = itemRect.left - dockRect.left + (itemRect.width - size) / 2;
    setLensW(size);
    setLensX(Math.max(0, x));
    setIdx(i);
  }, []);

  useLayoutEffect(() => {
    if (hide || !mounted) return;
    const i = activeIndex(path);
    placeLensOn(i, false);
    setReady(true);
    const onResize = () => placeLensOn(activeIndex(path), false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [path, hide, mounted, placeLensOn]);

  const nearestIndex = useCallback((clientX: number) => {
    let best = 0;
    let bestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const c = r.left + r.width / 2;
      const d = Math.abs(c - clientX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, []);

  const navigate = useCallback(
    (i: number) => {
      const item = ITEMS[i];
      placeLensOn(i, false);
      if (item.section) markEnterSection(item.section);
      router.push(item.href);
    },
    [placeLensOn, router]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    // Chỉ chuột trái hoặc touch/pen
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    placeLensOn(idx, true);
    dragOrigin.current = { pointerX: e.clientX, lensX };
    window.getSelection()?.removeAllRanges();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dockRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragOrigin.current.pointerX;
    if (Math.abs(dx) > 4) moved.current = true;

    const dock = dockRef.current;
    const rect = dock.getBoundingClientRect();
    const size = lensW;
    let next = dragOrigin.current.lensX + dx;
    const max = Math.max(0, rect.width - size);
    next = Math.min(max, Math.max(0, next));
    setLensX(next);

    const center = rect.left + next + size / 2;
    const near = nearestIndex(center);
    if (near !== idx) setIdx(near);
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
    if (!dock) {
      placeLensOn(idx, false);
      return;
    }
    const rect = dock.getBoundingClientRect();
    const center = rect.left + lensX + lensW / 2;
    const best = nearestIndex(center);
    placeLensOn(best, false);

    // Chỉ điều hướng nếu đã kéo hoặc click đúng tab
    if (moved.current || best !== activeIndex(path)) {
      navigate(best);
    } else {
      // click cùng tab — vẫn snap lens
      placeLensOn(best, false);
    }
  };

  const onItemClick = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    // Click nhanh không qua drag
    if (moved.current) return;
    navigate(i);
  };

  if (!mounted || hide) return null;

  const ui = (
    <>
      <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden>
        <defs>
          <filter id="opus-dock-refract" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={dragging ? 36 : 22} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <nav
        aria-label="Opus Dock"
        className={cn(
          "opus-glass-dock fixed z-[60] left-1/2 -translate-x-1/2",
          "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
          "pointer-events-none select-none"
        )}
        style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "none" }}
      >
        <div
          ref={dockRef}
          className={cn(
            "pointer-events-auto relative flex items-center justify-center",
            "gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1.5",
            "rounded-full",
            dragging ? "overflow-visible" : "overflow-hidden",
            "border border-white/25 bg-white/[0.12] backdrop-blur-xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
            "max-w-[min(100vw-0.75rem,560px)]",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* 1 lớp lens duy nhất — chỉ di chuyển khi kéo giữ */}
          <div
            aria-hidden
            className={cn(
              "absolute top-1/2 z-[1] pointer-events-none rounded-[18px]",
              "border border-white/40 bg-white/[0.16]",
              "shadow-[inset_0_0_16px_rgba(255,255,255,0.45),0_4px_16px_rgba(0,0,0,0.25)]",
              "backdrop-blur-md",
              !dragging && "transition-[transform,width,height] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            )}
            style={{
              width: lensW,
              height: lensW,
              transform: `translate3d(${lensX}px, -50%, 0) scale(${dragging ? 1.08 : 1})`,
              filter: ready ? "url(#opus-dock-refract)" : undefined,
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
                onClick={(e) => onItemClick(e, i)}
                className={cn(
                  "relative z-[2] flex flex-col items-center justify-center gap-0.5",
                  "w-[48px] sm:w-[56px] h-[48px] sm:h-[56px]",
                  "rounded-2xl outline-none bg-transparent",
                  "transition-[opacity,transform] duration-300 ease-out"
                )}
                style={{
                  opacity: active ? 1 : 0.55,
                  transform: active ? `scale(${dragging ? 1.2 : 1.08})` : "scale(1)",
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
                    "w-6 h-6 sm:w-7 sm:h-7 object-contain pointer-events-none",
                    // Tất cả icon → trắng, không nền thừa
                    "brightness-0 invert"
                  )}
                />
                <span
                  className={cn(
                    "text-[8px] sm:text-[9px] font-medium leading-none max-w-[52px] truncate",
                    active ? "text-white" : "text-white/60"
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

  return createPortal(ui, document.body);
}
