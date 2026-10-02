"use client";

import { useEffect, useState } from "react";
import { Flame, Loader2, Send } from "lucide-react";
import { useAccountStore } from "@/lib/account";

export default function StreakRestoreForm() {
  const username = useAccountStore((s) => s.username);
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState(
    "Web tạm ngưng / bảo trì làm mất chuỗi. Xin cấp lại số ngày chuỗi đã có."
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [mine, setMine] = useState<
    { id: number; days: number; status: string; created_at: string }[]
  >([]);

  const load = async () => {
    try {
      const res = await fetch("/api/streak/request");
      const data = await res.json();
      if (data.ok) setMine(data.items || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (username) void load();
  }, [username]);

  const submit = async () => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/streak/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: Math.floor(Number(days) || 0),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) setErr(data.error || "Gửi thất bại");
      else {
        setMsg("Đã gửi đơn. Admin sẽ duyệt và cấp lại chuỗi.");
        await load();
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  if (!username) {
    return (
      <p className="text-sm text-foreground-muted">
        Đăng nhập để gửi khiếu nại mất chuỗi.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Flame className="h-4 w-4 text-orange-500" />
        Khiếu nại mất chuỗi
      </p>
      <p className="text-xs text-foreground-muted">
        Nếu bảo trì / tạm dừng web làm mất chuỗi, nhập số ngày đã có và gửi đơn. Admin duyệt tại
        trang quản trị.
      </p>
      <label className="block text-xs text-foreground-muted">Số ngày chuỗi cần cấp lại</label>
      <input
        type="number"
        min={1}
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-orange-500"
      />
      <label className="block text-xs text-foreground-muted">Lý do</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-orange-500"
      />
      <button
        type="button"
        disabled={busy || Number(days) < 1}
        onClick={() => void submit()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Gửi đơn
      </button>
      {msg ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</p> : null}
      {err ? <p className="text-sm text-amber-600 dark:text-amber-400">{err}</p> : null}
      {mine.length > 0 ? (
        <ul className="space-y-1 border-t border-border pt-2 text-xs text-foreground-muted">
          {mine.map((r) => (
            <li key={r.id}>
              #{r.id} · {r.days} ngày · {r.status} ·{" "}
              {new Date(r.created_at).toLocaleString("vi-VN")}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
