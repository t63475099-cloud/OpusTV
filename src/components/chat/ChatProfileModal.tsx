"use client";

import { useRef, useState } from "react";
import { Camera, X, Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

export default function ChatProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const me = useChatStore((s) => s.me);
  const getUser = useChatStore((s) => s.getUser);
  const setChatAvatar = useChatStore((s) => s.setChatAvatar);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open || !me) return null;
  const user = getUser(me);

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Chỉ chọn ảnh");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErr("Ảnh tối đa 2MB");
      return;
    }
    setBusy(true);
    setErr(null);
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      setChatAvatar(data);
      setBusy(false);
    };
    reader.onerror = () => {
      setErr("Không đọc được ảnh");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#16181c] border border-[#2a2d34] shadow-2xl overflow-hidden">
        <div className="h-12 px-4 flex items-center justify-between border-b border-[#2a2d34]">
          <span className="text-sm font-semibold text-white">Ảnh đại diện Opus Chat</span>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <ChatAvatar user={user} size="lg" />
          <p className="text-xs text-zinc-500 text-center">
            Chỉ áp dụng trong Opus Chat.
          </p>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <div className="flex gap-2 w-full">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0068ff] text-white text-sm font-medium"
            >
              <Camera className="w-4 h-4" />
              {busy ? "Đang tải…" : "Chọn ảnh"}
            </button>
            <button
              type="button"
              onClick={() => setChatAvatar("")}
              className="px-3 rounded-xl bg-[#2a2e36] text-zinc-300"
              title="Xóa avatar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
