"use client";

import dynamic from "next/dynamic";

const OpusCodeLayout = dynamic(
  () => import("@/components/code/OpusCodeLayout"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#1e1e1e] text-zinc-500 text-sm">
        Đang tải Opus Code…
      </div>
    ),
  }
);

export default function OpusCodePage() {
  return <OpusCodeLayout />;
}
