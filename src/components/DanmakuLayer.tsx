"use client";

import { useEffect, useState } from "react";

export interface DanmakuItem {
  id: string;
  text: string;
  color?: string;
}

/** Bình luận trôi ngang kiểu Bilibili */
export default function DanmakuLayer({
  items,
  enabled,
}: {
  items: DanmakuItem[];
  enabled: boolean;
}) {
  const [queue, setQueue] = useState<(DanmakuItem & { top: number; duration: number })[]>([]);

  useEffect(() => {
    if (!enabled || !items.length) return;
    const latest = items[items.length - 1];
    if (!latest) return;
    setQueue((q) => {
      if (q.some((x) => x.id === latest.id)) return q;
      return [
        ...q,
        {
          ...latest,
          top: 8 + Math.random() * 55,
          duration: 8 + Math.random() * 4,
        },
      ].slice(-20);
    });
  }, [items, enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {queue.map((d) => (
        <span
          key={d.id}
          className="absolute whitespace-nowrap text-sm sm:text-base font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          style={{
            top: `${d.top}%`,
            left: "100%",
            color: d.color || "#fff",
            animation: `danmaku-move ${d.duration}s linear forwards`,
          }}
        >
          {d.text}
        </span>
      ))}
    </div>
  );
}
