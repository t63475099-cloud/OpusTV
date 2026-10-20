"use client";

import { useCallback, useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/leaderboardDb";
import { ProfileModal, FriendsPanel } from "./ProfileModal";

function formatVnd(n: number) {
  if (!n) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated font-bold text-foreground"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {letter}
    </div>
  );
}

export function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leaderboard?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setEntries(data.entries || []);
      else setError(data.error || "Không tải được bảng xếp hạng");
    } catch {
      setError("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Trophy className="h-6 w-6 text-amber-400" strokeWidth={1.75} />
            Bảng xếp hạng
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Xếp theo tổng tiền mua Key thành công
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FriendsPanel />
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-elevated"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 text-center text-sm text-rose-400">{error}</p>
      ) : null}

      {loading && entries.length === 0 ? (
        <p className="mt-16 text-center text-sm text-foreground-muted">Đang tải…</p>
      ) : entries.length === 0 ? (
        <p className="mt-16 text-center text-sm text-foreground-muted">
          Chưa có ai mua Key. Khi có đơn được duyệt, bảng xếp hạng sẽ hiện ở đây.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
          <ul className="divide-y divide-border">
            {entries.map((e) => (
              <li key={e.username}>
                <button
                  type="button"
                  onClick={() => setSelected(e.username)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-elevated"
                >
                  <span
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                      (e.rank === 1
                        ? "bg-amber-400 text-black"
                        : e.rank === 2
                          ? "bg-slate-300 text-black"
                          : e.rank === 3
                            ? "bg-amber-700/80 text-white"
                            : "bg-surface-elevated text-foreground-muted")
                    }
                  >
                    {e.rank}
                  </span>
                  <Avatar name={e.displayName} url={e.avatarUrl} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.displayName}</p>
                    <p className="font-mono text-[11px] text-foreground-muted">
                      UID: {e.uid}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-foreground-muted">
                      {e.totalKeysBought} Key
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {formatVnd(e.totalAmountSpent)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected ? (
        <ProfileModal username={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
