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

const N = ITEMS.length;
/** Đường kính vòng tròn cố định (px) — luôn tròn thật */
const CIRCLE = 44;

function shouldHideDock(path: string): boolean {
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
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const hide = shouldHideDock(path);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.dataset.dock = hide ? "0" : "1";
    return () => {
      document.documentElement.dataset.dock = "0";
    };
  }, [hide]);

  useEffect(() => {
    setIdx(activeIndex(path));
  }, [path]);

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
      setIdx(i);
      if (item.section) markEnterSection(item.section);
      router.push(item.href);
    },
    [router]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    moved.current = false;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    setIdx(nearestIndex(e.clientX));
    window.getSelection()?.removeAllRanges();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    if (Math.abs(e.clientX - startX.current) > 6) moved.current = true;
    setIdx(nearestIndex(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    const best = nearestIndex(e.clientX);
    setIdx(best);
    if (moved.current || best !== activeIndex(path)) {
      navigate(best);
    }
  };

  const onItemClick = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    if (moved.current) return;
    navigate(i);
  };

  if (!mounted || hide) return null;

  // Tâm vòng tròn = tâm tab idx (theo %)
  // left = (idx + 0.5) * (100/N)% - CIRCLE/2
  const lensLeft = `calc(${(idx + 0.5) * (100 / N)}% - ${CIRCLE / 2}px)`;

  const ui = (
    <nav
      aria-label="Opus Dock"
      className={cn(
        "opus-glass-dock fixed z-[60] left-1/2 -translate-x-1/2",
        "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
        "pointer-events-none select-none w-[min(100vw-0.75rem,560px)]"
      )}
      style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "none" }}
    >
      <div
        className={cn(
          "pointer-events-auto relative flex items-stretch w-full",
          "px-1.5 py-1.5 rounded-full overflow-hidden",
          "border border-white/25 bg-white/[0.12] backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Vòng tròn hoàn hảo: width === height (px), không filter méo */}
        <div
          aria-hidden
          className={cn(
            "absolute z-[1] pointer-events-none rounded-full",
            "border border-white/40 bg-white/[0.2]",
            "shadow-[inset_0_0_12px_rgba(255,255,255,0.45),0_2px_8px_rgba(0,0,0,0.2)]",
            "backdrop-blur-md",
            "transition-[left,transform] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          )}
          style={{
            left: lensLeft,
            top: "50%",
            width: CIRCLE,
            height: CIRCLE,
            transform: `translateY(-50%) scale(${dragging ? 1.1 : 1})`,
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
                "relative z-[2] flex flex-1 flex-col items-center justify-center gap-0.5",
                "min-w-0 h-[52px] sm:h-[56px] rounded-full outline-none bg-transparent",
                "transition-[opacity,transform] duration-300 ease-out"
              )}
              style={{
                opacity: active ? 1 : 0.55,
                transform: active && dragging ? "scale(1.1)" : active ? "scale(1.04)" : "scale(1)",
              }}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                draggable={false}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain pointer-events-none brightness-0 invert"
              />
              <span
                className={cn(
                  "text-[8px] sm:text-[9px] font-medium leading-none max-w-full px-0.5 truncate",
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
  );

  return createPortal(ui, document.body);
}
