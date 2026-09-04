"use client";

import type { ChatUser, UserStatus } from "@/lib/chatStore";

const statusColor: Record<UserStatus, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-zinc-500",
};

export default function ChatAvatar({
  user,
  size = "md",
  showStatus = true,
}: {
  user?: ChatUser | null;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}) {
  const dim = size === "sm" ? "w-9 h-9 text-sm" : size === "lg" ? "w-14 h-14 text-xl" : "w-11 h-11 text-base";
  const dot = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";
  const letter = (user?.name || "?").slice(0, 1).toUpperCase();
  const isEmoji = user?.avatar && /\p{Extended_Pictographic}/u.test(user.avatar);

  return (
    <div className={`relative shrink-0 ${dim}`}>
      <div
        className={`${dim} rounded-full bg-gradient-to-br from-rose-500/80 to-indigo-600/80 flex items-center justify-center text-white font-semibold overflow-hidden ring-1 ring-white/10`}
      >
        {isEmoji ? (
          <span className="leading-none">{user!.avatar}</span>
        ) : user?.avatar && user.avatar.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          letter
        )}
      </div>
      {showStatus && user && (
        <span
          className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-neutral-950 ${statusColor[user.status]}`}
          title={user.status}
        />
      )}
    </div>
  );
}
