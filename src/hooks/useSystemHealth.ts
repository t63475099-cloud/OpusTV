"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureFlags } from "@/lib/system/types";
import { SYSTEM_BC } from "@/lib/system/types";

const BUILD_KEY = "opus_client_build_id";

export function useSystemHealth() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [panicLockdown, setPanicLockdown] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverBuildId, setServerBuildId] = useState("");
  const initialBuild = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/system/version", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) return;
      setMaintenanceMode(!!data.maintenanceMode);
      setPanicLockdown(!!data.panicLockdown);
      if (data.featureFlags) setFeatureFlags(data.featureFlags);
      const bid = String(data.buildId || "");
      setServerBuildId(bid);
      if (!initialBuild.current) {
        initialBuild.current = bid;
        try {
          localStorage.setItem(BUILD_KEY, bid);
        } catch {
          /* */
        }
      } else if (bid && bid !== initialBuild.current) {
        setUpdateAvailable(true);
      }
      if (data.maintenanceMode && typeof window !== "undefined") {
        const path = window.location.pathname;
        if (
          !path.startsWith("/bao-tri") &&
          !path.startsWith("/admin") &&
          !path.startsWith("/api")
        ) {
          window.location.href = "/bao-tri";
        }
      }
    } catch {
      /* */
    }
  }, []);

  const softReload = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* */
    }
    window.location.reload();
  }, []);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), 60_000);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(SYSTEM_BC);
      bc.onmessage = (msg) => {
        if (msg.data?.kind === "maintenance" && msg.data.on) {
          window.location.href = "/bao-tri";
        }
      };
    } catch {
      /* */
    }
    return () => {
      clearInterval(id);
      try {
        bc?.close();
      } catch {
        /* */
      }
    };
  }, [check]);

  return {
    maintenanceMode,
    panicLockdown,
    featureFlags,
    updateAvailable,
    serverBuildId,
    softReload,
    refresh: check,
  };
}
