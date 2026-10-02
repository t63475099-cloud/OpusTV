"use client";

import { useMemo, useState } from "react";
import type { EpisodeItem } from "@/types/media";

interface Props {
  episodes: EpisodeItem[];
  currentNumber?: number | null;
  onSelect?: (ep: EpisodeItem) => void;
  groupSize?: number;
}

export function EpisodeSelector({
  episodes,
  currentNumber,
  onSelect,
  groupSize = 50,
}: Props) {
  const sorted = useMemo(
    () => [...episodes].sort((a, b) => a.number - b.number),
    [episodes]
  );

  const groups = useMemo(() => {
    if (!sorted.length) return [] as { label: string; items: EpisodeItem[] }[];
    const max = sorted[sorted.length - 1].number;
    const out: { label: string; items: EpisodeItem[] }[] = [];
    for (let start = 1; start <= max; start += groupSize) {
      const end = start + groupSize - 1;
      const items = sorted.filter((e) => e.number >= start && e.number <= end);
      if (items.length) {
        out.push({ label: `${start}–${Math.min(end, max)}`, items });
      }
    }
    return out;
  }, [sorted, groupSize]);

  const initialGroup = useMemo(() => {
    if (currentNumber == null || !groups.length) return 0;
    const idx = groups.findIndex((g) =>
      g.items.some((e) => e.number === currentNumber)
    );
    return idx >= 0 ? idx : 0;
  }, [groups, currentNumber]);

  const [groupIdx, setGroupIdx] = useState(initialGroup);
  const activeGroup = groups[groupIdx] || groups[0];

  if (!sorted.length) {
    return (
      <p className="text-sm text-foreground-muted">Chưa có danh sách tập</p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setGroupIdx(i)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums ui-border-contrast ${
                i === groupIdx
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {(activeGroup?.items || []).map((ep) => {
          const isActive = currentNumber === ep.number;
          const isWatched = ep.watched && !isActive;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => onSelect?.(ep)}
              title={ep.name || `Tập ${ep.number}`}
              className={`rounded-lg border px-1 py-2 text-center text-xs font-medium tabular-nums font-mono transition-opacity ui-border-contrast ${
                isActive
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : isWatched
                    ? "border-border bg-surface-elevated text-foreground-muted opacity-70"
                    : "border-border-strong bg-surface text-foreground"
              }`}
            >
              {ep.number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EpisodeSelector;
