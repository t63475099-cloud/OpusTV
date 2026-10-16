"use client";

import { PhimVipGate } from "@/components/vip/PhimVipGate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PhimVipGate>{children}</PhimVipGate>;
}
