"use client";

import { useEffect, useState, Component, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/account";

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

export default function SyncBootstrap() {
  const username = useAccountStore((s) => s.username);
  const syncNow = useAccountStore((s) => s.syncNow);
  const refreshMe = useAccountStore((s) => s.refreshMe);
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/tin-nhan");

  useEffect(() => {
    clearChromeLocks();
    window.addEventListener("pageshow", clearChromeLocks);
    window.addEventListener("focus", clearChromeLocks);
    // Gỡ khóa ngay khi vào bất kỳ trang nào (trừ chat)
    const t = window.setTimeout(clearChromeLocks, 0);
    return () => {
      window.removeEventListener("pageshow", clearChromeLocks);
      window.removeEventListener("focus", clearChromeLocks);
      window.clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    try {
      void refreshMe();
    } catch {
      /* ignore */
    }
  }, [refreshMe]);

  useEffect(() => {
    if (!username) return;
    const run = () => {
      try {
        void syncNow();
      } catch {
        /* ignore */
      }
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

  // Chat sync — dynamic import store để lỗi chat không treo toàn site
  useEffect(() => {
    let cancelled = false;
    let intervalId = 0;
    (async () => {
      try {
        const { useChatStore } = await import("@/lib/chatStore");
        if (cancelled) return;
        if (!username) {
          useChatStore.getState().setMe(null);
          return;
        }
        useChatStore.getState().setMe(username);
        try {
          useChatStore.getState().syncMyAvatarFromFilm?.();
        } catch {}
        const tick = () => {
          try {
            void useChatStore.getState().heartbeat();
            void useChatStore.getState().syncFromServer();
          } catch {}
        };
        tick();
        const ms = isChat ? 8000 : 25000;
        intervalId = window.setInterval(tick, ms);
      } catch (e) {
        console.error("[ChatSync]", e);
      }
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
