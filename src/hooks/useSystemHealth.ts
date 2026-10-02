"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureFlags } from "@/lib/system/types";
import { SYSTEM_BC } from "@/lib/system/types";

const BUILD_KEY = "opus_client_build_id";

function hasAdminBypass(): boolean {
  if (typeof document === "undefined") return false;
  const c = document.cookie || "";
  return (
    c.includes("opus_admin_gate=") ||
    c.includes("x-admin-bypass=1") ||
    window.location.pathname.startsWith("/admin")
  );
}

export function useSystemHealth() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [panicLockdown, setPanicLockdown] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverBuildId, setServerBuildId] = useState("");
  const initialBuild = useRef<string | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/system/version", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.ok) return;

      const on = !!data.maintenanceMode;
      setMaintenanceMode(on);
      setPanicLockdown(!!data.panicLockdown);
      if (data.featureFlags) setFeatureFlags(data.featureFlags);

      const bid = String(data.buildId || "");
      setServerBuildId(bid);

      if (!initialBuild.current) {
        let stored: string | null = null;
        try {
          stored = localStorage.getItem(BUILD_KEY);
        } catch {
          /* */
        }
        initialBuild.current = stored || bid;
        try {
          localStorage.setItem(BUILD_KEY, bid);
        } catch {
          /* */
        }
        if (stored && bid && stored !== bid) {
          setUpdateAvailable(true);
        }
      } else if (bid && bid !== initialBuild.current) {
        setUpdateAvailable(true);
      }

      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      const admin = hasAdminBypass();

      if (on) {
        if (!admin && !path.startsWith("/bao-tri") && !path.startsWith("/api")) {
          window.location.href = "/bao-tri";
        }
      } else if (path.startsWith("/bao-tri")) {
        try {
          localStorage.setItem(BUILD_KEY, bid);
        } catch {
          /* */
        }
        window.location.href = "/";
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
      try {
        if (serverBuildId) localStorage.setItem(BUILD_KEY, serverBuildId);
      } catch {
        /* */
      }
    } catch {
      /* */
    }
    window.location.reload();
  }, [serverBuildId]);

  useEffect(() => {
    void check();
    const id = setInterval(() => void check(), 30_000);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(SYSTEM_BC);
      bc.onmessage = (msg) => {
        if (msg.data?.kind === "maintenance") {
          if (msg.data.on && !hasAdminBypass()) {
            window.location.href = "/bao-tri";
          } else if (!msg.data.on && window.location.pathname.startsWith("/bao-tri")) {
            window.location.href = "/";
          } else {
            void check();
          }
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
