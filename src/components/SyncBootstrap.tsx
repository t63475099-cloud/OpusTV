"use client";

import { useEffect } from "react";
import { useAccountStore } from "@/lib/account";

/** Đồng bộ định kỳ khi đã đăng nhập (cookie session + Neon) */
export default function SyncBootstrap() {
  const username = useAccountStore((s) => s.username);
  const syncNow = useAccountStore((s) => s.syncNow);
  const refreshMe = useAccountStore((s) => s.refreshMe);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!username) return;
    const run = () => {
      void syncNow();
    };
    run();
    const id = window.setInterval(run, 5 * 60 * 1000);
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [username, syncNow]);

  return null;
}
