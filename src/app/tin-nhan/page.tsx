"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useChatStore } from "@/lib/chatStore";
import { useAccountStore } from "@/lib/account";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInfoPanel from "@/components/chat/ChatInfoPanel";
import CreateGroupModal from "@/components/chat/CreateGroupModal";

export default function TinNhanPage() {
  const activeId = useChatStore((s) => s.activeId);
  const setActive = useChatStore((s) => s.setActive);
  const conversations = useChatStore((s) => s.conversations);
  const showInfo = useChatStore((s) => s.showInfo);
  const setMe = useChatStore((s) => s.setMe);
  const syncFromServer = useChatStore((s) => s.syncFromServer);
  const loadThread = useChatStore((s) => s.loadThread);
  const me = useChatStore((s) => s.me);
  const error = useChatStore((s) => s.error);
  const username = useAccountStore((s) => s.username);

  const [createOpen, setCreateOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);

  const active = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    if (username) {
      setMe(username);
      void syncFromServer();
    } else {
      setMe(null);
    }
  }, [username, setMe, syncFromServer]);

  // Poll inbox + active thread mỗi 4s khi đã đăng nhập
  useEffect(() => {
    if (!username) return;
    const t = setInterval(() => {
      void syncFromServer();
      const c = useChatStore.getState().conversations.find(
        (x) => x.id === useChatStore.getState().activeId
      );
      const peer = c?.peerUsername;
      if (peer) void loadThread(peer);
    }, 2000);
    return () => clearInterval(t);
  }, [username, syncFromServer, loadThread]);

  useEffect(() => {
    if (activeId) setMobileChat(true);
  }, [activeId]);

  if (!username) {
    return (
      <div className="min-h-[100dvh] pt-20 px-4 flex flex-col items-center justify-center bg-neutral-950 text-center">
        <p className="text-white font-semibold text-lg mb-2">Đăng nhập để nhắn tin</p>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Nhắn tin realtime giữa các tài khoản OpusFilm (giống Zalo). Kết bạn bằng username hoặc UID của đối phương.
        </p>
        <Link
          href="/tai-khoan"
          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold"
        >
          Đăng nhập / Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] pt-14 bg-neutral-950 flex flex-col">
      {error && (
        <div className="mx-auto max-w-6xl w-full px-3 pt-2">
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
      <div className="flex-1 min-h-0 flex max-w-6xl w-full mx-auto border-x border-neutral-900">
        <ChatSidebar
          onOpenCreate={() => setCreateOpen(true)}
          hiddenOnMobileChat={mobileChat}
        />
        <ChatWindow
          conversation={active}
          onBack={() => {
            setMobileChat(false);
            setActive(null);
          }}
        />
        {active && showInfo && <ChatInfoPanel conversation={active} />}
      </div>
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <p className="sr-only">Đăng nhập: {me}</p>
    </div>
  );
}
