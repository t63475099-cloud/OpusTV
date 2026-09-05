"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import { useAccountStore } from "@/lib/account";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInfoPanel from "@/components/chat/ChatInfoPanel";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import IncomingCallBanner from "@/components/chat/IncomingCallBanner";

export default function TinNhanPage() {
  const username = useAccountStore((s) => s.username);
  const setMe = useChatStore((s) => s.setMe);
  const syncFromServer = useChatStore((s) => s.syncFromServer);
  const loadThread = useChatStore((s) => s.loadThread);
  const setActive = useChatStore((s) => s.setActive);
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const showInfo = useChatStore((s) => s.showInfo);
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const error = useChatStore((s) => s.error);

  const [createOpen, setCreateOpen] = useState(false);
  /** Chỉ dùng cho mobile: đang xem thread hay đang xem list */
  const [showThread, setShowThread] = useState(false);

  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    try {
      localStorage.removeItem("opusfilm-chat-server-v1");
      localStorage.removeItem("opusfilm-chat-server-v2");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (username) {
      setMe(username);
      try {
        useChatStore.getState().syncMyAvatarFromFilm();
      } catch {}
      void syncFromServer();
    } else {
      setMe(null);
    }
  }, [username, setMe, syncFromServer]);

  useEffect(() => {
    if (!username) return;
    const tick = () => {
      try {
        void syncFromServer();
        const st = useChatStore.getState();
        const c = st.conversations.find((x) => x.id === st.activeId);
        if (c?.peerUsername) void loadThread(c.peerUsername);
      } catch {
        /* ignore */
      }
    };
    const id = window.setInterval(tick, 6000);
    return () => window.clearInterval(id);
  }, [username, syncFromServer, loadThread]);

  // Khi activeId đổi (kết bạn / openDirect), mobile tự mở thread
  useEffect(() => {
    if (!activeId) return;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowThread(true);
    }
  }, [activeId]);

  useEffect(() => {
    document.documentElement.classList.add("opus-chat-lock", "opus-chat-page");
    return () => {
      document.documentElement.classList.remove("opus-chat-lock", "opus-chat-page");
    };
  }, []);

  const openChat = useCallback(
    (id: string) => {
      setActive(id);
      setShowThread(true);
    },
    [setActive]
  );

  const backToList = useCallback(() => {
    // Chỉ ẩn thread trên mobile — KHÔNG xóa activeId
    setShowThread(false);
  }, []);

  if (!username) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#16181c] px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0068ff] flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">Opus Chat</p>
        <p className="text-sm text-zinc-400 mb-6 max-w-xs">
          Đăng nhập để nhắn tin và kết bạn bằng UID.
        </p>
        <Link
          href="/tai-khoan"
          className="px-6 py-2.5 rounded-lg bg-[#0068ff] text-white text-sm font-semibold"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex bg-[#0e1012] text-zinc-100"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <p className="text-xs text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        </div>
      )}

      {/* Trái: danh sách */}
      <div
        className={`h-full w-full md:w-[340px] lg:w-[360px] shrink-0 border-r border-[#2a2d34] flex-col bg-[#16181c] ${
          showThread ? "hidden md:flex" : "flex"
        }`}
      >
        <ChatSidebar
          onOpenCreate={() => setCreateOpen(true)}
          onSelectConversation={openChat}
        />
      </div>

      {/* Giữa: cửa sổ chat */}
      <div
        className={`h-full flex-1 min-w-0 flex-col bg-[#1a1d21] ${
          showThread ? "flex" : "hidden md:flex"
        }`}
      >
        <ChatWindow
          conversation={active}
          onBack={backToList}
          onToggleInfo={() => setShowInfo(!showInfo)}
        />
      </div>

      {/* Phải: thông tin hội thoại */}
      {active && showInfo && (
        <div className="hidden xl:flex h-full w-[300px] shrink-0 border-l border-[#2a2d34] bg-[#16181c]">
          <ChatInfoPanel conversation={active} />
        </div>
      )}

      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <IncomingCallBanner />
    </div>
  );
}
