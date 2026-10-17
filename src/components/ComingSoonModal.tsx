"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";

type Payload = { title?: string; message?: string };

let listeners: Array<(p: Payload | null) => void> = [];

export function openComingSoon(title = "Sắp ra mắt", message = "Tính năng đang được hoàn thiện. Vui lòng quay lại sau.") {
  const p = { title, message };
  listeners.forEach((fn) => fn(p));
}

export function ComingSoonModal() {
  const [payload, setPayload] = useState<Payload | null>(null);

  useEffect(() => {
    const fn = (p: Payload | null) => setPayload(p);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((x) => x !== fn);
    };
  }, []);

  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPayload(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload]);

  if (!payload) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setPayload(null);
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl ui-border-contrast">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full border border-border p-1.5 text-foreground-muted"
          onClick={() => setPayload(null)}
          aria-label="Đóng"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Clock className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{payload.title || "Sắp ra mắt"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {payload.message || "Tính năng đang được hoàn thiện. Vui lòng quay lại sau."}
        </p>
        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          onClick={() => setPayload(null)}
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
