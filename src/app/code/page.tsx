"use client";

import dynamic from "next/dynamic";

const OpusCodeIDE = dynamic(() => import("@/components/code/OpusCodeIDE"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[#1e1e1e] text-zinc-400 text-sm">
      Đang tải Opus Code…
    </div>
  ),
});

export default function OpusCodePage() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] bg-[#1e1e1e]">
      <OpusCodeIDE />
    </main>
  );
}
