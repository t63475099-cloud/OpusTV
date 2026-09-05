"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import { useAccountStore } from "@/lib/account";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInfoPanel from "@/components/chat/ChatInfoPanel";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import ChatCanvas from "@/components/chat/ChatCanvas";

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
      try {
        void syncFromServer();
        const c = useChatStore
          .getState()
          .conversations.find((x) => x.id === useChatStore.getState().activeId);
        const peer = c?.peerUsername;
        if (peer) void loadThread(peer);
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [username, syncFromServer, loadThread]);

  useEffect(() => {
    if (activeId) setMobileChat(true);
  }, [activeId]);

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
      <div className="min-h-[100dvh] oc-shell relative flex flex-col items-center justify-center px-4 text-center pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)]">
        <ChatCanvas />
        <div className="relative z-10 oc-glass rounded-3xl p-8 max-w-sm w-full oc-bubble-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-xl shadow-rose-500/30">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <p className="text-white font-bold text-xl mb-1">Opus Chat</p>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Đăng nhập để nhắn tin, kết bạn bằng UID và đồng bộ trên mọi thiết bị.
          </p>
          <Link
            href="/tai-khoan"
            className="inline-flex w-full items-center justify-center px-5 py-3 rounded-2xl text-sm font-semibold text-white oc-send-btn"
          >
            Đăng nhập / Đăng ký
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col oc-shell"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <ChatCanvas />
      {error && (
        <div className="relative z-10 shrink-0 px-3 pt-2">
          <p className="text-xs text-amber-200 oc-glass rounded-xl px-3 py-2 border border-amber-500/20">
            {error}
          </p>
        </div>
      )}
      <div className="relative z-10 flex-1 min-h-0 flex w-full max-w-6xl mx-auto md:my-2 md:rounded-3xl md:overflow-hidden md:border md:border-white/10 md:shadow-2xl md:shadow-black/40">
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
