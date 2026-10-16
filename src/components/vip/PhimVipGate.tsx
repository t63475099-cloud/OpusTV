"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVipAccess } from "@/lib/vipAccess";
import { isVipActive } from "@/lib/vipCatalog";
import { requestVipAccess } from "@/components/vip/VipGateProvider";

/** Client gate for /phim/[slug] — redirect home + modal if no VIP */
export function PhimVipGate({ children }: { children: React.ReactNode }) {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const hasVipAccess = isVipActive({ isLifetime, expiresAtMs: vipExpiresAt });
  const router = useRouter();

  useEffect(() => {
    if (!hasVipAccess) {
      requestVipAccess();
      router.replace("/home");
    }
  }, [hasVipAccess, router]);

  if (!hasVipAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-background px-4 text-sm text-foreground-muted">
        Cần VIP để xem phim
      </div>
    );
  }
  return <>{children}</>;
}
