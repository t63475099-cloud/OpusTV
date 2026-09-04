"use client";

import { useEffect, useState } from "react";
import { X, UserPlus, Copy, Check } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

export default function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const friendUsers = useChatStore((s) => s.friendUsers);
  const addFriendByQuery = useChatStore((s) => s.addFriendByQuery);
  const openDirect = useChatStore((s) => s.openDirect);
  const [selected, setSelected] = useState<string[]>([]);
  const [uid, setUid] = useState("");
  const [msg, setMsg] = useState("");
  const [myUid, setMyUid] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/chat/friends")
      .then((r) => r.json())
      .then((d) => {
        if (d.me?.uid) setMyUid(String(d.me.uid));
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;
  const friends = friendUsers();

  function toggle(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
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
      <div className="relative w-full sm:max-w-md max-h-[88dvh] rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <h2 className="text-white font-semibold">Kết bạn bằng UID</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-3 space-y-3">
          {myUid && (
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5">
              <p className="text-[11px] text-zinc-500 mb-1">UID của bạn (gửi cho bạn bè)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-rose-300 font-mono tracking-wider">{myUid}</code>
                <button
                  type="button"
                  onClick={copyUid}
                  className="p-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-1.5">Nhập UID người muốn kết bạn</p>
            <div className="flex gap-2">
              <input
                value={uid}
                onChange={(e) => setUid(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="VD: 1234567890"
                inputMode="numeric"
                className="flex-1 rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2.5 text-sm text-white font-mono outline-none focus:border-rose-500/40"
              />
              <button
                type="button"
                onClick={onAddFriend}
                className="px-3 rounded-xl bg-rose-600 text-white text-sm font-medium flex items-center gap-1 shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Kết bạn
              </button>
            </div>
            {msg && <p className="text-xs text-amber-300 mt-1.5">{msg}</p>}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <p className="px-3 text-[11px] text-zinc-600 mb-1">Bạn bè đã kết</p>
          {friends.length === 0 ? (
            <p className="text-center text-sm text-zinc-600 py-8">Chưa có bạn bè</p>
          ) : (
            friends.map((u) => {
              const on = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                    on ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <ChatAvatar user={u} size="sm" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white font-medium truncate">{u.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      UID {u.uid || "—"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </ul>

        <div className="p-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              if (selected.length === 1) {
                openDirect(selected[0]);
                onClose();
              } else if (selected.length === 0 && friends[0]) {
                openDirect(friends[0].id);
                onClose();
              } else {
                setMsg("Chọn 1 bạn để mở chat");
              }
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-semibold"
          >
            Mở chat
          </button>
        </div>
      </div>
    </div>
  );
}
