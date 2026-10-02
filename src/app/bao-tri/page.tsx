"use client";

import { useEffect, useState } from "react";

/**
 * Trang bảo trì — chỉ khi Admin bật (DB).
 * Tự về / khi Admin tắt.
 */
export default function BaoTriPage() {
  const [message, setMessage] = useState(
    "Hệ thống đang bảo trì. Vui lòng quay lại sau."
  );
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/system/version", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();
        if (cancelled || !data?.ok) return;

        if (!data.maintenanceMode) {
          window.location.href = "/";
          return;
        }
        if (data.maintenanceMessage) {
          setMessage(String(data.maintenanceMessage));
        }
        if (data.maintenanceUntil) {
          try {
            setUntil(
              new Date(data.maintenanceUntil).toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })
            );
          } catch {
            setUntil(String(data.maintenanceUntil));
          }
        } else {
          setUntil(null);
        }
      } catch {
        /* */
      }
    };

    void poll();
    const id = setInterval(() => void poll(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface/80 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-2xl">
          🔧
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Đang bảo trì</h1>
        <p className="mt-3 text-sm text-foreground-muted leading-relaxed">{message}</p>
        {until && (
          <p className="mt-2 text-xs text-amber-400/90">Dự kiến mở lại: {until}</p>
        )}
        <p className="mt-6 text-[11px] text-foreground-subtle">
          Trang sẽ tự mở lại khi bảo trì kết thúc.
        </p>
      </div>
    </main>
  );
}
