"use client";

import { useEventStore } from "@/lib/eventCoins";

/**
 * Lấy grant chưa claim từ server → cộng/trừ xu → đánh dấu claimed trên server.
 * Không cộng lại khi F5.
 */
export async function applyPendingCoinGrants(): Promise<{ gained: number; appliedIds: number[] }> {
  let gained = 0;
  const appliedIds: number[] = [];
  try {
    const cr = await fetch("/api/coins/me", { credentials: "include" });
    const cd = await cr.json();
    if (!cd?.ok) return { gained: 0, appliedIds: [] };
    const list: { id: number; amount: number }[] = Array.isArray(cd.grants)
      ? cd.grants
      : cd.grant
        ? [cd.grant]
        : [];
    for (const g of list) {
      const gid = Number(g.id);
      const amt = Math.floor(Number(g.amount) || 0);
      if (!gid || !Number.isFinite(amt) || amt === 0) continue;
      const before = useEventStore.getState().coins;
      useEventStore.getState().grantCoins(amt, gid);
      const after = useEventStore.getState().coins;
      // Chỉ claim khi grantCoins thực sự đổi số dư hoặc đã từng apply id (tránh loop)
      const applied = useEventStore.getState().appliedCoinGrantIds || [];
      if (after !== before || applied.includes(gid)) {
        appliedIds.push(gid);
        gained += after - before;
      }
    }
    if (appliedIds.length) {
      await fetch("/api/coins/me", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: appliedIds }),
      }).catch(() => null);
    }
  } catch {
    /* */
  }
  return { gained, appliedIds };
}
