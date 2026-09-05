"use client";

import { useEffect } from "react";
import { useAccountStore } from "@/lib/account";
import { useChatStore } from "@/lib/chatStore";

/** Đồng bộ định kỳ khi đã đăng nhập (cookie session + Neon) */
export default function SyncBootstrap() {
  const username = useAccountStore((s) => s.username);
  const syncNow = useAccountStore((s) => s.syncNow);
  const refreshMe = useAccountStore((s) => s.refreshMe);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  // Gỡ khóa scroll bị kẹt (fullscreen player / chat) khi vào lại trang thường
  useEffect(() => {
    const clearLocks = () => {
      const path = window.location.pathname || "";
      if (!path.startsWith("/tin-nhan")) {
        document.documentElement.classList.remove("opus-chat-lock");
      }
      if (!document.querySelector(".player-shell:fullscreen, .player-fs-css")) {
        document.body.classList.remove("player-fs-lock");
        document.documentElement.classList.remove(
          "opus-hide-chrome",
          "player-fs-html-lock"
        );
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }
    };
    clearLocks();
    window.addEventListener("pageshow", clearLocks);
    return () => window.removeEventListener("pageshow", clearLocks);
  }, []);

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

  // Opus Chat: đồng bộ hộp thư + đẩy thông báo tin mới ra chuông / hòm thư
  useEffect(() => {
    if (!username) {
      useChatStore.getState().setMe(null);
      return;
    }
    useChatStore.getState().setMe(username);
    const tick = () => {
      try {
        void useChatStore.getState().heartbeat();
        void useChatStore.getState().syncFromServer();
      } catch {
        /* không làm sập trang */
      }
    };
    tick();
    const id = window.setInterval(tick, 12_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [username]);

  return null;
}
