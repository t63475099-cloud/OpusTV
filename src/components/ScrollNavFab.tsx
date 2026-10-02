"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

function getScrollTop() {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

function getScrollHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
}

const BTN =
  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-surface text-foreground shadow-lg transition hover:bg-surface-elevated active:scale-95 ui-border-contrast";

export default function ScrollNavFab() {
  const pathname = usePathname() || "/";
  const [show, setShow] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const hide =
    pathname.startsWith("/tin-nhan") ||
    pathname.startsWith("/phim/") ||
    pathname.startsWith("/bao-tri");

  const update = useCallback(() => {
    if (hide) {
      setShow(false);
      return;
    }
    const top = getScrollTop();
    const max = getScrollHeight() - window.innerHeight;
    setAtTop(top < 80);
    setAtBottom(max > 0 && top >= max - 120);
    setShow(max > 200 && top > 120);
  }, [hide]);

  useEffect(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, pathname]);

  if (hide || !show) return null;

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const scrollBottom = () => {
    window.scrollTo({ top: getScrollHeight(), behavior: "smooth" });
  };

  return (
    <div
      className="fixed z-[60] flex flex-col gap-2"
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
      }}
      data-scroll-fab
    >
      {!atTop && (
        <button
          type="button"
          onClick={scrollTop}
          className={BTN}
          aria-label="Lên đầu trang"
          title="Lên trên"
        >
          <ChevronUp className="h-5 w-5 shrink-0 text-foreground" strokeWidth={2.75} />
        </button>
      )}
      {!atBottom && (
        <button
          type="button"
          onClick={scrollBottom}
          className={BTN}
          aria-label="Xuống cuối trang"
          title="Xuống dưới"
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-foreground" strokeWidth={2.75} />
        </button>
      )}
    </div>
  );
}
