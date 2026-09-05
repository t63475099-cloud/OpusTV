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
          className="w-11 h-11 rounded-full bg-[#1a1a1a]/92 border border-white/10 shadow-lg shadow-black/40 flex items-center justify-center text-white hover:bg-[#2a2a2a] active:scale-95 transition backdrop-blur-md"
          aria-label="Lên đầu trang"
          title="Lên trên"
        >
          <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}
      {!atBottom && (
        <button
          type="button"
          onClick={scrollBottom}
          className="w-11 h-11 rounded-full bg-[#1a1a1a]/92 border border-white/10 shadow-lg shadow-black/40 flex items-center justify-center text-white hover:bg-[#2a2a2a] active:scale-95 transition backdrop-blur-md"
          aria-label="Xuống cuối trang"
          title="Xuống dưới"
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
