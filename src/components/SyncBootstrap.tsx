"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAccountStore } from "@/lib/account";
import { useChatStore } from "@/lib/chatStore";

export default function SyncBootstrap() {
  const username = useAccountStore((s) => s.username);
  const syncNow = useAccountStore((s) => s.syncNow);
  const refreshMe = useAccountStore((s) => s.refreshMe);
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/tin-nhan");

  useEffect(() => {
    try {
      void refreshMe();
    } catch {
      /* ignore */
    }
  }, [refreshMe]);

  useEffect(() => {
    const clearLocks = () => {
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
    };
    clearLocks();
    window.addEventListener("pageshow", clearLocks);
    return () => window.removeEventListener("pageshow", clearLocks);
  }, []);

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

  // Chat sync — chỉ khi đã đăng nhập; interval dài hơn trên trang không phải chat
  useEffect(() => {
    if (!username) {
      try {
        useChatStore.getState().setMe(null);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      useChatStore.getState().setMe(username);
    } catch {
      /* ignore */
    }
    const tick = () => {
      try {
        void useChatStore.getState().heartbeat();
        void useChatStore.getState().syncFromServer();
      } catch {
        /* ignore */
      }
    };
    tick();
    const ms = isChat ? 8000 : 20000;
    const id = window.setInterval(tick, ms);
    return () => window.clearInterval(id);
  }, [username, isChat]);

  return null;
}
