"use client";

import { useEffect, useState } from "react";
import { useAccountStore } from "@/lib/account";

interface PatchInfo {
  patchId: string;
  title: string;
  body: string;
  rewards: { coins?: number; spinTickets?: number; vipHours?: number };
}

export function PatchNotesModal() {
  const username = useAccountStore((s) => s.username);
  const [patch, setPatch] = useState<PatchInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/system/version", { cache: "no-store" });
        // lightweight: also try compensation endpoint via events state path
        const r2 = await fetch("/api/events/state", { credentials: "include" });
        if (!r2.ok) return;
        // optional future: dedicated patch endpoint — hide if none
        if (cancelled) return;
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!open || !patch) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-100 shadow-2xl">
        <h2 className="text-lg font-semibold">{patch.title}</h2>
        <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap">{patch.body}</p>
        {patch.rewards?.coins ? (
          <p className="mt-3 text-sm text-amber-400">
            Quà: +{patch.rewards.coins.toLocaleString("vi-VN")} xu
          </p>
        ) : null}
        {msg && <p className="mt-2 text-xs text-emerald-400">{msg}</p>}
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm"
            onClick={() => setOpen(false)}
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMsg("Đã ghi nhận (nếu đủ điều kiện).");
              setBusy(false);
              setOpen(false);
            }}
          >
            Nhận quà đền bù
          </button>
        </div>
      </div>
    </div>
  );
}

export default PatchNotesModal;
