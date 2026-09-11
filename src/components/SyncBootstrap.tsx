"use client";

import { useEffect, useState, useRef, Component, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/account";
import { useEventStore } from "@/lib/eventCoins";
import { useOpusPassStore } from "@/lib/opusPass";
import { useHistoryStore } from "@/lib/history";
import { useFavoritesStore } from "@/lib/favorites";
import { useSettingsStore } from "@/lib/settings";

/** Bắt lỗi client để không làm trắng cả site */
class BootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    try {
      console.error("[OpusBoot]", err);
    } catch {}
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function clearChromeLocks() {
  try {
    const path = window.location.pathname || "";
    if (!path.startsWith("/tin-nhan")) {
      document.documentElement.classList.remove("opus-chat-lock", "opus-chat-page");
    }
    if (!document.querySelector(".player-shell:fullscreen, .player-fs-css")) {
      document.body.classList.remove("player-fs-lock");
      document.documentElement.classList.remove(
        "opus-hide-chrome",
        "player-fs-html-lock"
      );
    }
  } catch {
    /* ignore */
  }
}

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (fn: () => void) => () => void;
};

function waitStoreHydration(store: { persist?: PersistApi }): Promise<void> {
  return new Promise((resolve) => {
    const p = store.persist;
    if (!p?.hasHydrated) {
      resolve();
      return;
    }
    if (p.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = p.onFinishHydration?.(() => {
      try {
        unsub?.();
      } catch {}
      resolve();
    });
    // timeout an toàn
    window.setTimeout(() => resolve(), 2500);
  });
}

async function waitAllHydrated() {
  await Promise.all([
    waitStoreHydration(useAccountStore),
    waitStoreHydration(useEventStore),
    waitStoreHydration(useOpusPassStore),
    waitStoreHydration(useHistoryStore),
    waitStoreHydration(useFavoritesStore),
    waitStoreHydration(useSettingsStore),
  ]);
}

function IncomingCallLazy() {
  const [Node, setNode] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    let alive = true;
    import("@/components/chat/IncomingCallBanner")
      .then((m) => {
        if (alive) setNode(() => m.default);
      })
      .catch((e) => console.error("[IncomingCall]", e));
    return () => {
      alive = false;
    };
  }, []);
  if (!Node) return null;
  return <Node />;
}

/**
 * Đồng bộ toàn bộ dữ liệu tài khoản mỗi lần reload / vào trang / focus.
 * Gồm: lịch sử, yêu thích, nhạc, settings, profile, Sự kiện, VIP, Opus Pass + Chat.
 */
export default function SyncBootstrap() {
  const username = useAccountStore((s) => s.username);
  const syncNow = useAccountStore((s) => s.syncNow);
  const refreshMe = useAccountStore((s) => s.refreshMe);
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/tin-nhan");
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    clearChromeLocks();
    window.addEventListener("pageshow", clearChromeLocks);
    window.addEventListener("focus", clearChromeLocks);
    const t = window.setTimeout(clearChromeLocks, 0);
    return () => {
      window.removeEventListener("pageshow", clearChromeLocks);
      window.removeEventListener("focus", clearChromeLocks);
      window.clearTimeout(t);
    };
  }, [pathname]);

  /** Full sync: chờ hydrate local → refresh session → merge cloud */
  const fullSync = async (reason: string) => {
    if (typeof window === "undefined") return;
    if (syncingRef.current) return;
    const now = Date.now();
    // tránh spam trong < 1.5s (trừ force reload)
    if (reason !== "reload" && reason !== "hydrate" && now - lastSyncRef.current < 1500) {
      return;
    }
    syncingRef.current = true;
    try {
      await waitAllHydrated();
      await refreshMe();
      const u = useAccountStore.getState().username;
      if (!u) return;
      await syncNow();
      lastSyncRef.current = Date.now();
      // Chat
      try {
        const { useChatStore } = await import("@/lib/chatStore");
        useChatStore.getState().setMe(u);
        useChatStore.getState().syncMyAvatarFromFilm?.();
        await useChatStore.getState().syncFromServer?.();
        await useChatStore.getState().heartbeat?.();
      } catch {
        /* chat optional */
      }
    } catch (e) {
      console.error("[FullSync]", reason, e);
    } finally {
      syncingRef.current = false;
    }
  };

  // 1) Mỗi lần mount / reload trang
  useEffect(() => {
    void fullSync("reload");
    const onPageShow = (ev: PageTransitionEvent) => {
      // pageshow kể cả bfcache
      void fullSync(ev.persisted ? "bfcache" : "pageshow");
    };
    const onFocus = () => void fullSync("focus");
    const onVis = () => {
      if (document.visibilityState === "visible") void fullSync("visible");
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Khi username xuất hiện (sau hydrate / đăng nhập)
  useEffect(() => {
    if (!username) return;
    void fullSync("hydrate");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // 3) Mỗi lần đổi route (SPA)
  useEffect(() => {
    if (!username) return;
    void fullSync("route");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, username]);

  // 4) Interval dự phòng (60s)
  useEffect(() => {
    if (!username) return;
    const id = window.setInterval(() => void fullSync("interval"), 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Chat heartbeat riêng khi đang ở /tin-nhan
  useEffect(() => {
    if (!username || !isChat) return;
    let intervalId = 0;
    let cancelled = false;
    (async () => {
      try {
        const { useChatStore } = await import("@/lib/chatStore");
        if (cancelled) return;
        const tick = () => {
          try {
            void useChatStore.getState().heartbeat();
            void useChatStore.getState().syncFromServer();
          } catch {}
        };
        tick();
        intervalId = window.setInterval(tick, 8000);
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [username, isChat]);

  return (
    <BootErrorBoundary>
      <IncomingCallLazy />
    </BootErrorBoundary>
  );
}
