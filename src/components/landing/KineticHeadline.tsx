"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Typewriter một dòng — gõ liên tục, không xuống dòng, lặp vô hạn.
 */
export default function KineticHeadline({
  text = "Hệ sinh thái duy nhất. Trải nghiệm liền mạch.",
  className,
  /** @deprecated dùng text */
  line1,
  line2,
}: {
  text?: string;
  className?: string;
  line1?: string;
  line2?: string;
}) {
  const full = (text || [line1, line2].filter(Boolean).join(" ")).replace(/\n/g, " ").trim();
  const [shown, setShown] = useState("");
  const [phase, setPhase] = useState<"write" | "hold" | "erase">("write");

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const schedule = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const tickWrite = () => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        setPhase("hold");
        schedule(() => {
          setPhase("erase");
          tickErase();
        }, 2200);
        return;
      }
      const ch = full[i - 1];
      schedule(tickWrite, ch === " " || ch === "." ? 70 : 46);
    };

    const tickErase = () => {
      i -= 1;
      if (i <= 0) {
        i = 0;
        setShown("");
        setPhase("write");
        schedule(tickWrite, 480);
        return;
      }
      setShown(full.slice(0, i));
      schedule(tickErase, 20);
    };

    setShown("");
    setPhase("write");
    schedule(tickWrite, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [full]);

  const showCursor = phase !== "hold";

  return (
    <h1
      className={cn(
        "relative z-10 mt-2 sm:mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.2]",
        "min-h-[1.4em] max-w-full px-1",
        className
      )}
      aria-label={full}
    >
      <span className="bg-gradient-to-r from-white via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
        {shown}
        {showCursor && (
          <span
            className="inline-block w-[0.07em] h-[0.85em] ml-0.5 align-[-0.06em] bg-rose-400 animate-pulse"
            aria-hidden
          />
        )}
      </span>
    </h1>
  );
}
