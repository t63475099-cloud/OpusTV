"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isVipActive } from "@/lib/vipCatalog";

interface VipAccessState {
  isLifetime: boolean;
  vipExpiresAt: number | null;
  coins: number;
  setFromServer: (p: {
    isLifetime?: boolean;
    vipExpiresAt?: number | string | null;
    coins?: number;
  }) => void;
  hasVip: () => boolean;
}

function parseExp(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

export const useVipAccess = create<VipAccessState>()(
  persist(
    (set, get) => ({
      isLifetime: false,
      vipExpiresAt: null,
      coins: 0,
      setFromServer: (p) =>
        set({
          isLifetime: Boolean(p.isLifetime),
          vipExpiresAt: parseExp(p.vipExpiresAt ?? null),
          coins: typeof p.coins === "number" ? p.coins : get().coins,
        }),
      hasVip: () =>
        isVipActive({
          isLifetime: get().isLifetime,
          expiresAtMs: get().vipExpiresAt,
        }),
    }),
    { name: "opus-vip-access" }
  )
);
