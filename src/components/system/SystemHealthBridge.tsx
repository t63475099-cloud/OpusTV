"use client";

import { useSystemHealth } from "@/hooks/useSystemHealth";

/** Mount in root layout — version poll + maintenance redirect + update toast */
export function SystemHealthBridge() {
  const { updateAvailable, softReload } = useSystemHealth();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-violet-500/40 bg-zinc-950/95 px-4 py-2 text-sm text-zinc-100 shadow-xl backdrop-blur">
      Đã có bản cập nhật mới.{" "}
      <button
        type="button"
        onClick={() => void softReload()}
        className="font-semibold text-violet-400 underline"
      >
        Làm mới ngay
      </button>
    </div>
  );
}

export default SystemHealthBridge;
