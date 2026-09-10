"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Users, Check, UserPlus, Copy } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

type Tab = "group" | "friend";

export default function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const friendUsers = useChatStore((s) => s.friendUsers);
  const addFriendByQuery = useChatStore((s) => s.addFriendByQuery);
  const createGroup = useChatStore((s) => s.createGroup);
  const [tab, setTab] = useState<Tab>("group");
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [uid, setUid] = useState("");
  const [msg, setMsg] = useState("");
  const [myUid, setMyUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab("group");
    setSelected([]);
    setTitle("");
    setMsg("");
    setQ("");
    fetch("/api/chat/friends")
      .then((r) => r.json())
      .then((d) => {
        if (d.me?.uid) setMyUid(String(d.me.uid));
      })
      .catch(() => {});
  }, [open]);

  const friends = useMemo(() => {
    try {
      const list = typeof friendUsers === "function" ? friendUsers() : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, [friendUsers, open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return friends;
    return friends.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(s) ||
        (u.id || "").toLowerCase().includes(s) ||
        (u.nickname || "").toLowerCase().includes(s)
    );
  }, [friends, q]);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function onCreateGroup() {
    if (selected.length < 1) {
      setMsg("Chọn ít nhất 1 bạn bè");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const name =
        title.trim() ||
        filtered
          .filter((f) => selected.includes(f.id))
          .map((f) => f.name || f.id)
          .slice(0, 3)
          .join(", ");
      createGroup(name, selected);
      onClose();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Không tạo được nhóm");
    } finally {
      setBusy(false);
    }
  }

  async function onAddFriend() {
    setMsg("Đang tìm theo UID...");
    const r = await addFriendByQuery(uid);
    setMsg(r.message);
    if (r.ok) setUid("");
  }

  async function copyUid() {
    if (!myUid) return;
    try {
      await navigator.clipboard.writeText(myUid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90dvh] rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-white font-semibold">
            {tab === "group" ? "Tạo nhóm" : "Kết bạn bằng UID"}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-neutral-800">
          <button
            type="button"
            onClick={() => setTab("group")}
            className={`flex-1 py-2.5 text-sm font-medium ${
              tab === "group" ? "text-white border-b-2 border-rose-500" : "text-zinc-500"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <Users className="w-4 h-4" /> Tạo nhóm
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("friend")}
            className={`flex-1 py-2.5 text-sm font-medium ${
              tab === "friend" ? "text-white border-b-2 border-rose-500" : "text-zinc-500"
            }`}
          >
            <span className="inline-flex items-center gap-1.5 justify-center">
              <UserPlus className="w-4 h-4" /> Kết bạn
            </span>
          </button>
        </div>

        {tab === "group" ? (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="px-4 pt-3 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên nhóm (tuỳ chọn)"
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/50"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm bạn bè..."
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/50"
              />
              <p className="text-[11px] text-zinc-500">
                Đã chọn {selected.length} thành viên
              </p>
            </div>
            <div className="flex-1 overflow-y-auto opus-chat-scroll custom-scroll px-2 py-2 max-h-[45vh]">
              {filtered.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8 px-4">
                  Chưa có bạn bè. Sang tab Kết bạn để thêm bằng UID.
                </p>
              ) : (
                filtered.map((u) => {
                  const on = selected.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggle(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                        on ? "bg-rose-500/15" : "hover:bg-white/5"
                      }`}
                    >
                      <ChatAvatar user={u} size="sm" showStatus={false} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{u.name || u.id}</p>
                        <p className="text-[11px] text-zinc-500 truncate">@{u.id}</p>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          on ? "bg-rose-500 border-rose-500" : "border-zinc-600"
                        }`}
                      >
                        {on ? <Check className="w-3 h-3 text-white" /> : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {msg ? <p className="px-4 text-xs text-amber-400 pb-1">{msg}</p> : null}
            <div className="p-4 border-t border-neutral-800">
              <button
                type="button"
                disabled={busy || selected.length < 1}
                onClick={() => void onCreateGroup()}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-semibold"
              >
                {busy ? "Đang tạo..." : "Tạo nhóm"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {myUid && (
              <div className="rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5">
                <p className="text-[11px] text-zinc-500 mb-1">UID của bạn</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-rose-300 font-mono tracking-wider">{myUid}</code>
                  <button
                    type="button"
                    onClick={() => void copyUid()}
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <input
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="Nhập UID bạn bè (10 số)"
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/50"
            />
            {msg ? <p className="text-xs text-zinc-400">{msg}</p> : null}
            <button
              type="button"
              onClick={() => void onAddFriend()}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold"
            >
              Kết bạn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
