"use client";

/** Chat không dùng PhimVipGate (tránh redirect / crash). VIP check ở từng tính năng nếu cần. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
