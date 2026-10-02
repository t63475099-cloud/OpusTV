"use client";

/**
 * Mount once in layout — keeps SSE alive while user is logged in.
 * Does not render UI; SecurityDevicesCard is the visible panel.
 */

import { useEffect } from "react";
import { useAccountRealtime } from "@/hooks/useAccountRealtime";
import { useAccountStore } from "@/lib/account";

export function AccountRealtimeBridge() {
  const username = useAccountStore((s) => s.username);

  useAccountRealtime({
    enabled: !!username,
    onForceLogout: (message) => {
      try {
        useAccountStore.getState().logout();
      } catch {
        /* */
      }
      if (typeof window !== "undefined") {
        const q = encodeURIComponent(message || "Phiên đã kết thúc");
        window.location.href = `/tai-khoan?reason=${q}`;
      }
    },
    onStateMutated: (snap) => {
      // Sync coins into event store if present
      try {
        // dynamic import avoid circular
        void import("@/lib/eventCoins").then((mod) => {
          if (mod.useEventStore && typeof snap.coins === "number") {
            const cur = mod.useEventStore.getState().coins;
            if (cur !== snap.coins) {
              mod.useEventStore.setState({ coins: snap.coins });
            }
          }
          if (snap.vipExpiresAt && mod.useEventStore) {
            const t = new Date(snap.vipExpiresAt).getTime();
            if (Number.isFinite(t)) {
              mod.useEventStore.setState({ vipExpiresAt: t });
            }
          }
        });
      } catch {
        /* */
      }
    },
  });

  useEffect(() => {
    // heartbeat POST every 60s to refresh last_active_at
    if (!username) return;
    const tick = () => {
      void fetch("/api/auth/sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat" }),
      }).catch(() => undefined);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [username]);

  return null;
}

export default AccountRealtimeBridge;
