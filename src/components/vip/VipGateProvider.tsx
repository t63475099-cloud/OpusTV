"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountStore } from "@/lib/account";
import { useVipAccess } from "@/lib/vipAccess";
import { UnactivatedAccessModal, type VipGateAction } from "./UnactivatedAccessModal";
import { VipShopModal } from "./VipShopModal";
import { RedeemKeyModal } from "./RedeemKeyModal";
import { QuestCenterModal } from "./QuestCenterModal";

export function VipGateProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const username = useAccountStore((s) => s.username);
  const hasVip = useVipAccess((s) => s.hasVip);
  const setFromServer = useVipAccess((s) => s.setFromServer);
  const [gateOpen, setGateOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [questOpen, setQuestOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
    void fetch(`/api/vip/status?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setFromServer({
            isLifetime: d.isLifetime,
            vipExpiresAt: d.vipExpiresAt,
            coins: d.coins,
          });
        }
      })
      .catch(() => {});
  }, [username, setFromServer]);

  // Hard-lock music/chat routes
  useEffect(() => {
    if (hasVip()) return;
    if (pathname.startsWith("/nhac") || pathname.startsWith("/tin-nhan")) {
      setGateOpen(true);
      router.replace("/home");
    }
  }, [pathname, hasVip, router]);

  useEffect(() => {
    const onNeed = () => setGateOpen(true);
    window.addEventListener("opus-vip-required", onNeed);
    return () => window.removeEventListener("opus-vip-required", onNeed);
  }, []);

  const onGateAction = useCallback((a: VipGateAction) => {
    setGateOpen(false);
    if (a === "shop") setShopOpen(true);
    if (a === "redeem") setRedeemOpen(true);
    if (a === "quests") setQuestOpen(true);
  }, []);

  return (
    <>
      {children}
      <UnactivatedAccessModal open={gateOpen} onAction={onGateAction} />
      <VipShopModal open={shopOpen} onClose={() => setShopOpen(false)} />
      <RedeemKeyModal open={redeemOpen} onClose={() => setRedeemOpen(false)} />
      <QuestCenterModal open={questOpen} onClose={() => setQuestOpen(false)} />
    </>
  );
}

export function requestVipAccess() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("opus-vip-required"));
  }
}
