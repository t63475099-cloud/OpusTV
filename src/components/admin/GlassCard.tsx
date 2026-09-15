"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function GlassCard({
  children,
  className,
  hover = true,
  accent,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  accent?: "rose" | "violet" | "sky" | "amber" | "emerald" | "none";
}) {
  const accentMap = {
    rose: "from-rose-600/25 via-transparent to-transparent",
    violet: "from-violet-600/25 via-transparent to-transparent",
    sky: "from-sky-600/20 via-transparent to-transparent",
    amber: "from-amber-500/20 via-transparent to-transparent",
    emerald: "from-emerald-600/20 via-transparent to-transparent",
    none: "",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-[rgba(18,18,22,0.72)] backdrop-blur-xl",
        "shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        hover &&
          "hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[rgba(24,24,30,0.82)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)]",
        className
      )}
    >
      {accent && accent !== "none" ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
            accentMap[accent]
          )}
        />
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
