"use client";

import Link from "next/link";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export default function BangXepHangPage() {
  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link
          href="/mua-key"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          ← Mua Key
        </Link>
      </div>
      <LeaderboardView />
    </div>
  );
}
