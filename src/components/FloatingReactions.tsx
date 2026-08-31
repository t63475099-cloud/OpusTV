"use client";

import { useCallback, useState } from "react";

type Particle = { id: number; emoji: string; x: number };

const EMOJIS = ["❤️", "🔥", "😂", "👏", "😍"];

export default function FloatingReactions({
  onReact,
}: {
  onReact?: (emoji: string) => void;
}) {
  const [parts, setParts] = useState<Particle[]>([]);

  const burst = useCallback(
    (emoji: string) => {
      onReact?.(emoji);
      const id = Date.now() + Math.random();
      const batch: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
        id: id + i,
        emoji,
        x: 20 + Math.random() * 60,
      }));
      setParts((p) => [...p, ...batch].slice(-40));
      setTimeout(() => {
        setParts((p) => p.filter((x) => x.id < id || x.id > id + 10));
      }, 1800);
    },
    [onReact]
  );

  return (
    <div className="relative">
      <div className="flex gap-1.5">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => burst(e)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-base hover:scale-110 hover:bg-white/10 transition"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 h-40 overflow-hidden">
        {parts.map((p) => (
          <span
            key={p.id}
            className="absolute text-xl"
            style={{
              left: `${p.x}%`,
              bottom: 0,
              animation: "floatUp 1.6s ease-out forwards",
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
