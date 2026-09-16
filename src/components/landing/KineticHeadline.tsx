"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Typewriter (write) animation — gõ từng ký tự, lặp vô hạn.
 * Giống hiệu ứng “AI đang viết”, không chạy marquee ngang.
 */
export default function KineticHeadline({
  line1,
  line2,
  className,
}: {
  line1: string;
  line2: string;
  className?: string;
}) {
  const full = `${line1}\n${line2}`;
  const [text, setText] = useState("");
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
      setText(full.slice(0, i));
      if (i >= full.length) {
        setPhase("hold");
        schedule(() => {
          setPhase("erase");
          tickErase();
        }, 2200);
        return;
      }
      schedule(tickWrite, 48 + (full[i - 1] === " " ? 40 : 0));
    };

    const tickErase = () => {
      i -= 1;
      if (i <= 0) {
        i = 0;
        setText("");
        setPhase("write");
        schedule(tickWrite, 500);
        return;
      }
      setText(full.slice(0, i));
      schedule(tickErase, 22);
    };

    schedule(tickWrite, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [full]);

  const [shown1, shown2 = ""] = text.split("\n");
  const onLine2 = text.includes("\n");
  const showCursor = phase !== "hold";

  return (
    <h1
      className={cn(
        "relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.12] min-h-[2.4em]",
        className
      )}
      aria-label={`${line1} ${line2}`}
    >
      <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
        {shown1}
        {!onLine2 && showCursor && (
          <span className="inline-block w-[0.08em] h-[0.9em] ml-0.5 align-[-0.08em] bg-rose-400 animate-pulse" />
        )}
      </span>
      {onLine2 && (
        <>
          <br />
          <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            {shown2}
            {showCursor && (
              <span className="inline-block w-[0.08em] h-[0.9em] ml-0.5 align-[-0.08em] bg-fuchsia-400 animate-pulse" />
            )}
          </span>
        </>
      )}
    </h1>
  );
}
