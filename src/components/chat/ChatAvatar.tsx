"use client";

import { useMemo, useState } from "react";
import type { ChatUser, UserStatus } from "@/lib/chatStore";
import { getLqAvatarUrl, isPresetAvatar } from "@/lib/settings";

const statusColor: Record<UserStatus, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-zinc-500",
};

const PALETTE = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-indigo-500 to-blue-700",
  "from-fuchsia-500 to-rose-600",
  "from-cyan-500 to-sky-600",
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function resolveAvatarSrc(avatar?: string): string | null {
  if (!avatar) return null;
  const a = avatar.trim();
  if (!a) return null;
  if (
    a.startsWith("http://") ||
    a.startsWith("https://") ||
    a.startsWith("data:") ||
    a.startsWith("blob:")
  ) {
    return a;
  }
  if (a.startsWith("/")) return a;
  if (a.startsWith("lq:")) return getLqAvatarUrl(a);
  if (a.startsWith("preset:")) {
    // preset id → LQ style URL nếu có
    try {
      const url = getLqAvatarUrl(a.replace("preset:", "lq:") as string);
      if (url) return url;
    } catch {}
  }
  return null;
}

function isLikelyEmoji(s: string) {
  if (!s || s.length > 8) return false;
  if (
    s.startsWith("http") ||
    s.startsWith("data:") ||
    s.startsWith("/") ||
    s.startsWith("lq:") ||
    s.startsWith("preset:")
  ) {
    return false;
  }
  try {
    return /[^\x00-\x7F]/.test(s) && !s.includes("/") && s.length <= 4;
  } catch {
    return false;
  }
}

export default function ChatAvatar({
  user,
  size = "md",
  showStatus = true,
}: {
  user?: ChatUser | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}) {
  const dim =
    size === "sm" ? "w-9 h-9 text-sm" : size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-base";
  const dot = size === "sm" ? "w-2.5 h-2.5" : size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3";
  const display = user?.name || user?.nickname || user?.id || "?";
  const letter = display.slice(0, 1).toUpperCase();
  const av = (user?.avatar || "").trim();
  const src = useMemo(() => resolveAvatarSrc(av), [av]);
  const emoji = isLikelyEmoji(av);
  const preset = isPresetAvatar(av);
  const [imgErr, setImgErr] = useState(false);
  const showImg = !!src && !imgErr;
  const gradient = hashColor(display);
  const st: UserStatus =
    user?.status === "online" || user?.status === "away" ? user.status : "offline";

  return (
    <div className={`relative shrink-0 ${dim}`}>
      <div
        className={`${dim} rounded-full flex items-center justify-center text-white font-semibold overflow-hidden ring-1 ring-white/10 bg-gradient-to-br ${
          showImg ? "from-zinc-700 to-zinc-900" : gradient
        }`}
      >
        {showImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src!}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : emoji ? (
          <span className="leading-none text-[1.1em]">{av}</span>
        ) : preset ? (
          <span className="leading-none">{letter}</span>
        ) : (
          letter
        )}
      </div>
      {showStatus && user && (
        <span
          className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-[#16181c] ${statusColor[st]}`}
        />
      )}
    </div>
  );
}
