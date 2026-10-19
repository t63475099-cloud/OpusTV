"use client";

import Link from "next/link";
import { KeyPurchasePanel } from "@/components/payment/KeyPurchasePanel";

export default function MuaKeyPage() {
  return (
    <div className="min-h-[100dvh] bg-background px-3 py-8 text-foreground sm:px-4 sm:py-12">
      <div className="mx-auto mb-2 max-w-6xl">
        <Link
          href="/home"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          ← Trang chủ
        </Link>
      </div>
      <KeyPurchasePanel />
    </div>
  );
}
