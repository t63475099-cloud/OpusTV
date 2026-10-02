"use client";

import { useSystemHealth } from "@/hooks/useSystemHealth";

/** Mount in root layout — version poll + maintenance redirect + update toast */
export function SystemHealthBridge() {
  const { updateAvailable, softReload } = useSystemHealth();

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground shadow-xl"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      Đã có bản cập nhật mới.{" "}
      <button
        type="button"
        onClick={() => void softReload()}
        className="font-semibold text-primary underline underline-offset-2"
      >
        Làm mới ngay
      </button>
    </div>
  );
}

export default SystemHealthBridge;
