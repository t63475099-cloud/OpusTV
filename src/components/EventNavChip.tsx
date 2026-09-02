"use client";

import Link from "next/link";
import { Coins, Gift } from "lucide-react";
import { useEventStore } from "@/lib/eventCoins";

/** Chip Sự kiện + số xu trên thanh menu */
export default function EventNavChip() {
  const coins = useEventStore((s) => s.coins ?? 0);

  return (
    <Link
      href="/su-kien"
      className="flex items-center gap-1 sm:gap-1.5 shrink-0 rounded-full px-2 sm:px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 transition"
      title="Sự kiện · Xu"
      aria-label={`Sự kiện, ${coins} xu`}
    >
      <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
      <span className="hidden sm:inline text-xs font-semibold">Sự kiện</span>
      <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular-nums">
        <Coins className="w-3 h-3" />
        {coins}
      </span>
    </Link>
  );
}
