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
      <p className="text-sm text-zinc-500">Đăng nhập để gửi khiếu nại mất chuỗi.</p>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-orange-100 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        Khiếu nại mất chuỗi
      </p>
      <p className="text-xs text-zinc-500">
        Nếu bảo trì / tạm dừng web làm mất chuỗi, nhập số ngày đã có và gửi đơn. Admin duyệt tại trang quản trị.
      </p>
      <label className="text-xs text-zinc-400 block">Số ngày chuỗi cần cấp lại</label>
      <input
        type="number"
        min={1}
        value={days}
        onChange={(e) => setDays(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-orange-500"
      />
      <label className="text-xs text-zinc-400 block">Lý do</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-orange-500 resize-y"
      />
      <button
        type="button"
        disabled={busy || Number(days) < 1}
        onClick={() => void submit()}
        className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-semibold text-white disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Gửi đơn
      </button>
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      {err && <p className="text-sm text-amber-400">{err}</p>}
      {mine.length > 0 && (
        <ul className="text-xs text-zinc-500 space-y-1 pt-2 border-t border-white/5">
          {mine.map((r) => (
            <li key={r.id}>
              #{r.id} · {r.days} ngày · {r.status} ·{" "}
              {new Date(r.created_at).toLocaleString("vi-VN")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
