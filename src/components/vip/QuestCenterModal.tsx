"use client";

import { useState } from "react";
import { CheckCircle2, ListChecks, Trophy, X } from "lucide-react";
import { QUESTS } from "@/lib/quests";
import { useAccountStore } from "@/lib/account";
import { useVipAccess } from "@/lib/vipAccess";

export function QuestCenterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const username = useAccountStore((s) => s.username);
  const setFromServer = useVipAccess((s) => s.setFromServer);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!open) return null;

  const claim = async (questId: string) => {
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    setBusy(questId);
    setMsg(null);
    try {
      const res = await fetch("/api/vip/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, questId, action: "claim" }),
      });
      const data = await res.json();
      if (!data.ok) setMsg(data.error || "Không nhận được thưởng");
      else {
        if (typeof data.coins === "number") setFromServer({ coins: data.coins });
        setMsg(data.message || `+${data.reward || 0} Xu`);
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(null);
    }
  };

  const groups = [
    { id: "easy", label: "Dễ", items: QUESTS.filter((q) => q.difficulty === "easy") },
    { id: "medium", label: "Trung bình", items: QUESTS.filter((q) => q.difficulty === "medium") },
    { id: "hard", label: "Khó", items: QUESTS.filter((q) => q.difficulty === "hard") },
  ];

  return (
    <div
      className="fixed inset-0 z-[101] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ui-border-contrast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-foreground">Nhiệm vụ kiếm Xu</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto p-4">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                <Trophy className="h-4 w-4" strokeWidth={1.75} />
                {g.label}
              </p>
              <div className="space-y-2">
                {g.items.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 ui-border-contrast"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{q.title}</p>
                      <p className="text-xs tabular-nums text-foreground-muted">+{q.reward} Xu</p>
                    </div>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void claim(q.id)}
                      className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground disabled:opacity-50"
                    >
                      {busy === q.id ? "…" : "Nhận"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {msg ? (
          <p className="border-t border-border px-4 py-2 text-xs text-foreground-muted">{msg}</p>
        ) : null}
      </div>
    </div>
  );
}
