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

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Podium order: 2, 1, 3 visually
  const podiumOrder =
    top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : top3;

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
        <>
          {/* Podium */}
          {top3.length > 0 ? (
            <div className="mt-10 flex items-end justify-center gap-2 sm:gap-4">
              {podiumOrder.map((e) => {
                const isFirst = e.rank === 1;
                const isSecond = e.rank === 2;
                return (
                  <button
                    key={e.username}
                    type="button"
                    onClick={() => setSelected(e.username)}
                    className={
                      "flex flex-col items-center rounded-2xl border border-border bg-surface px-3 py-4 text-center transition hover:border-violet-500/40 sm:px-5 " +
                      (isFirst
                        ? "order-2 mb-2 min-w-[110px] sm:min-w-[140px] shadow-lg shadow-violet-500/10 border-violet-500/30"
                        : isSecond
                          ? "order-1 min-w-[96px] sm:min-w-[120px]"
                          : "order-3 min-w-[96px] sm:min-w-[120px]")
                    }
                  >
                    <span
                      className={
                        "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " +
                        (isFirst
                          ? "bg-amber-400 text-black"
                          : isSecond
                            ? "bg-slate-300 text-black"
                            : "bg-amber-700/80 text-white")
                      }
                    >
                      {e.rank}
                    </span>
                    <Avatar name={e.displayName} url={e.avatarUrl} size={isFirst ? 64 : 48} />
                    <p className="mt-2 max-w-[100px] truncate text-sm font-semibold sm:max-w-[120px]">
                      {e.displayName}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-foreground-muted">
                      UID: {e.uid}
                    </p>
                    <p className="mt-2 text-xs text-foreground-muted">
                      {e.totalKeysBought} Key
                    </p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                      {formatVnd(e.totalAmountSpent)}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* List rank 4+ */}
          {rest.length > 0 ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
              <ul className="divide-y divide-border">
                {rest.map((e) => (
                  <li key={e.username}>
                    <button
                      type="button"
                      onClick={() => setSelected(e.username)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-elevated"
                    >
                      <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-foreground-muted">
                        #{e.rank}
                      </span>
                      <Avatar name={e.displayName} url={e.avatarUrl} size={40} />
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
          ) : null}
        </>
      )}

      {selected ? (
        <ProfileModal username={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
