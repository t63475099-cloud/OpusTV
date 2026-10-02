"use client";

import { useSystemHealth } from "@/hooks/useSystemHealth";

/**
 * Toast cập nhật bản build — 1 nút rõ, tương phản cao cả Light/Dark.
 * Không chồng chữ, không pill đen + chữ tím khó đọc.
 */
export function SystemHealthBridge() {
  const { updateAvailable, softReload } = useSystemHealth();

  if (!updateAvailable) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-4"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => void softReload()}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-2 border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition active:scale-[0.98]"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary-foreground/90" aria-hidden />
        Làm mới ngay
      </button>
    </div>
  );
}

export default SystemHealthBridge;
