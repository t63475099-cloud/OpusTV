"use client";

import { useMemo, useState } from "react";
import type { ChatUser, UserStatus } from "@/lib/chatStore";
import {
  getLqAvatarUrl,
  isPresetAvatar,
  getAvatarFrame,
  useSettingsStore,
} from "@/lib/settings";
import { useAccountStore } from "@/lib/account";

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
    try {
      return getLqAvatarUrl(a.replace("preset:", "lq:")) || null;
    } catch {
      return null;
    }
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
  frameId,
}: {
  user?: ChatUser | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  /** ép khung viền (mặc định: lấy từ settings nếu là chính mình) */
  frameId?: string;
}) {
  const accountUser = useAccountStore((s) => s.username);
  const myFrame = useSettingsStore((s) => s.profile?.avatarFrame);
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

  const isMe =
    !!user?.id &&
    !!accountUser &&
    user.id.toLowerCase() === accountUser.toLowerCase();
  const resolvedFrameId =
    frameId ||
    (user as ChatUser & { frame?: string })?.frame ||
    (isMe ? myFrame : undefined) ||
    "frame:none";
  const frame = getAvatarFrame(resolvedFrameId);
  const hasFrame = frame && frame.id !== "frame:none" && frame.css && frame.css !== "none";

  const st: UserStatus = user?.status || "offline";

  return (
    <div className={`relative shrink-0 ${dim}`}>
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${
          showImg ? "from-zinc-700 to-zinc-900" : gradient
        } ${hasFrame ? `avatar-frame ${frame.css}` : "ring-1 ring-white/10"}`}
        style={hasFrame ? undefined : undefined}
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
        ) : (
          <span className="font-semibold text-white/95">{letter}</span>
        )}
      </div>
      {showStatus && user && (
        <span
          className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-[#16181c] ${statusColor[st]}`}
          title={st === "online" ? "Đang hoạt động" : st === "away" ? "Vắng mặt" : "Ngoại tuyến"}
        />
      )}
    </div>
  );
}

/** Avatar nhóm — ghép tối đa 4 ảnh thành viên */
export function GroupAvatar({
  members,
  size = "md",
  title,
}: {
  members: (ChatUser | null | undefined)[];
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const dim =
    size === "sm" ? "w-9 h-9" : size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const list = members.filter(Boolean).slice(0, 4) as ChatUser[];
  if (list.length === 0) {
    return (
      <div
        className={`${dim} rounded-full bg-[#0068ff] flex items-center justify-center text-white font-semibold shrink-0`}
      >
        {(title || "N").slice(0, 1).toUpperCase()}
      </div>
    );
  }
  if (list.length === 1) {
    return <ChatAvatar user={list[0]} size={size} showStatus={false} />;
  }
  const grid =
    list.length === 2
      ? "grid-cols-2"
      : list.length === 3
        ? "grid-cols-2"
        : "grid-cols-2";
  return (
    <div className={`${dim} rounded-full overflow-hidden grid ${grid} gap-px bg-[#16181c] shrink-0 ring-1 ring-white/10`}>
      {list.map((u) => {
        const src = resolveAvatarSrc(u.avatar);
        const letter = (u.name || u.id || "?").slice(0, 1).toUpperCase();
        return (
          <div
            key={u.id}
            className={`bg-gradient-to-br ${hashColor(u.name || u.id)} flex items-center justify-center overflow-hidden`}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[8px] text-white font-bold">{letter}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
