"use client";

import { cn } from "@/lib/utils";

export default function SubtitleOverlay({
  text,
  visible,
  large,
}: {
  text: string;
  visible: boolean;
  large?: boolean;
}) {
  if (!visible || !text) return null;
  return (
    <div
      data-controls
      className={cn(
        "pointer-events-none absolute inset-x-0 z-[15] flex justify-center px-3 sm:px-8",
        "bottom-[18%] sm:bottom-[16%]"
      )}
    >
      <p
        className={cn(
          "max-w-[92%] sm:max-w-[80%] text-center font-medium leading-snug",
          "text-white rounded-md px-3 py-1.5",
          "bg-black/55 backdrop-blur-[2px] shadow-[0_2px_12px_rgba(0,0,0,0.45)]",
          large ? "text-base sm:text-xl" : "text-sm sm:text-lg"
        )}
        style={{ textShadow: "0 1px 2px #000, 0 0 8px rgba(0,0,0,.8)" }}
      >
        {text}
      </p>
    </div>
  );
}
