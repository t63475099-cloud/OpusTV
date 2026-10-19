"use client";

import Link from "next/link";
import { KeyPurchasePanel } from "@/components/payment/KeyPurchasePanel";

export default function MuaKeyPage() {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-10 text-foreground">
      <div className="mx-auto mb-6 max-w-[520px]">
        <Link href="/home" className="text-sm text-foreground-muted hover:text-foreground">
          ← Trang chủ
        </Link>
        <h1 className="mt-3 text-xl font-semibold">Mua Key</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Chọn gói, chuyển khoản đúng thông tin ngân hàng, chờ admin gửi key.
        </p>
      </div>
      <KeyPurchasePanel />
    </div>
  );
}
