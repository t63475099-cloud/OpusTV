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

  useEffect(() => {
    if (!username) return;
    const t = setInterval(() => {
      void syncFromServer();
      const c = useChatStore
        .getState()
        .conversations.find((x) => x.id === useChatStore.getState().activeId);
      const peer = c?.peerUsername;
      if (peer) void loadThread(peer);
    }, 2000);
    return () => clearInterval(t);
  }, [username, syncFromServer, loadThread]);

  useEffect(() => {
    if (activeId) setMobileChat(true);
  }, [activeId]);

  // Chỉ khóa scroll body khi ở trang chat; luôn dọn class fullscreen cũ
  useEffect(() => {
    document.documentElement.classList.add("opus-chat-lock");
    document.documentElement.classList.add("opus-chat-page");
    document.body.classList.remove("player-fs-lock");
    document.documentElement.classList.remove("opus-hide-chrome", "player-fs-html-lock");
    return () => {
      document.documentElement.classList.remove("opus-chat-lock");
      document.documentElement.classList.remove("opus-chat-page");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (!username) {
    return (
      <div className="min-h-[100dvh] px-4 flex flex-col items-center justify-center bg-neutral-950 text-center pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)]">
        <p className="text-white font-semibold text-lg mb-2">Đăng nhập để dùng Opus Chat</p>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Kết bạn bằng UID trong Tài khoản. Mỗi người một tài khoản riêng.
        </p>
        <Link
          href="/tai-khoan"
          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold active:scale-95"
        >
          Đăng nhập / Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-neutral-950"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {error && (
        <div className="shrink-0 px-3 pt-1">
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
      <div className="flex-1 min-h-0 flex w-full max-w-6xl mx-auto border-x border-neutral-900/80">
        <ChatSidebar
          onOpenCreate={() => setCreateOpen(true)}
          hiddenOnMobileChat={mobileChat}
        />
        <div className={`flex-1 min-w-0 min-h-0 flex ${mobileChat ? "flex" : "hidden md:flex"}`}>
          <ChatWindow
            conversation={active}
            onBack={() => {
              setMobileChat(false);
              setActive(null);
            }}
          />
          {active && showInfo && (
            <div className="hidden lg:flex">
              <ChatInfoPanel conversation={active} />
            </div>
          )}
        </div>
      </div>
      <CreateGroupModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <span className="sr-only">{me}</span>
    </div>
  );
}
