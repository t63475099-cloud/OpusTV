"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const ease = "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";

export default function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] shadow-2xl shadow-black/50",
        `transition-all ${ease}`,
        hover && "hover:scale-[1.01] hover:bg-white/[0.07] hover:border-white/[0.14]",
        className
      )}
    >
      {children}
    </div>
  );
}
