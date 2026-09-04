"use client";

import { useMemo, useState } from "react";
import { X, Users, MessageSquare } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

export default function NewChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const users = useChatStore((s) => s.users);
  const createDirect = useChatStore((s) => s.createDirect);
  const createGroup = useChatStore((s) => s.createGroup);
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  const contacts = useMemo(() => users.filter((u) => u.id !== "me"), [users]);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      mode === "dm"
        ? [id]
        : prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  function submit() {
    if (mode === "dm" && selected[0]) {
      createDirect(selected[0]);
      onClose();
      setSelected([]);
      return;
    }
    if (mode === "group" && selected.length >= 1) {
      createGroup(title || "Nhóm OpusFilm", selected);
      onClose();
      setSelected([]);
      setTitle("");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      <div className="relative w-full sm:max-w-md max-h-[85dvh] rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white font-semibold">Tạo trò chuyện</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => {
              setMode("dm");
              setSelected([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
              mode === "dm" ? "bg-rose-600 text-white" : "bg-white/5 text-zinc-300"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Nhắn tin
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("group");
              setSelected([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
              mode === "group" ? "bg-indigo-600 text-white" : "bg-white/5 text-zinc-300"
            }`}
          >
            <Users className="w-4 h-4" /> Nhóm
          </button>
        </div>

        {mode === "group" && (
          <div className="px-4 pt-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên nhóm"
              className="w-full rounded-xl bg-neutral-950 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-indigo-500/50"
            />
          </div>
        )}

        <ul className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {contacts.map((u) => {
            const on = selected.includes(u.id);
            return (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => toggle(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                    on ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <ChatAvatar user={u} size="sm" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white font-medium truncate">{u.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{u.bio || u.status}</p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      on ? "border-rose-500 bg-rose-500" : "border-zinc-600"
                    }`}
                  >
                    {on && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={submit}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-sm font-semibold disabled:opacity-40"
          >
            {mode === "dm" ? "Bắt đầu chat" : `Tạo nhóm (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
