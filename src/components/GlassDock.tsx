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

/** Icon trắng: mask luminance để bỏ nền đen (Music) / giữ silhouette */
function DockIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      className={cn("block bg-white", className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      aria-hidden
    />
  );
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
          "px-1 py-1.5 rounded-full overflow-hidden",
          "border border-white/25 bg-white/[0.12] backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
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
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "min-w-0 h-[58px] outline-none bg-transparent overflow-hidden",
                "transition-opacity duration-300"
              )}
              style={{ opacity: active ? 1 : 0.55 }}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon + vòng tròn cùng hộp */}
              <span className="relative flex items-center justify-center w-10 h-10 shrink-0">
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 rounded-full",
                    "border border-white/40 bg-white/[0.22]",
                    "shadow-[inset_0_0_10px_rgba(255,255,255,0.35)]",
                    "pointer-events-none transition-all duration-300 ease-out",
                    active ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}
                  style={{
                    transform: active ? `scale(${dragging ? 1.08 : 1})` : "scale(0.75)",
                  }}
                />
                {item.id === "music" ? (
                  // Music PNG nền đen → chỉ lấy nốt trắng, bỏ khối thừa
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.icon}
                    alt=""
                    draggable={false}
                    className="relative z-[1] w-5 h-5 sm:w-6 sm:h-6 object-contain pointer-events-none"
                    style={{
                      filter: "invert(1) brightness(1.2)",
                      mixBlendMode: "screen",
                    }}
                  />
                ) : (
                  <DockIcon src={item.icon} className="relative z-[1] w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </span>

              {/* Label luôn trong dock, truncate */}
              <span
                className={cn(
                  "w-full text-center text-[8px] font-medium leading-tight px-0.5 truncate",
                  active ? "text-white" : "text-white/55"
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
