"use client";

import {
  isPresetAvatar,
  presetGradient,
  type UserProfile,
} from "@/lib/settings";
import { User, BadgeCheck } from "lucide-react";

interface Props {
  profile: Pick<UserProfile, "name" | "avatar" | "avatarPosition" | "verified">;
  size?: number;
  className?: string;
  ring?: boolean;
  /** Hiện tích xanh */
  showBadge?: boolean;
}

export default function UserAvatar({
  profile,
  size = 40,
  className = "",
  ring = false,
  showBadge = false,
}: Props) {
  const style = {
    width: size,
    height: size,
    objectPosition: profile.avatarPosition || "50% 50%",
  };

  const ringCls = ring
    ? "ring-2 ring-red-500/60 ring-offset-2 ring-offset-[#0a0a0a]"
    : "";

  let body: React.ReactNode;

  if (profile.avatar && !isPresetAvatar(profile.avatar)) {
    body = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar}
        alt={profile.name || "Avatar"}
        className={`rounded-full object-cover bg-zinc-800 ${ringCls} ${className}`}
        style={style}
      />
    );
  } else if (isPresetAvatar(profile.avatar)) {
    const letter = (profile.name || "?").charAt(0).toUpperCase();
    body = (
      <div
        className={`rounded-full bg-gradient-to-br ${presetGradient(
          profile.avatar
        )} flex items-center justify-center text-white font-bold select-none ${ringCls} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {letter}
      </div>
    );
  } else {
    body = (
      <div
        className={`rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 ${ringCls} ${className}`}
        style={{ width: size, height: size }}
      >
        <User style={{ width: size * 0.45, height: size * 0.45 }} />
      </div>
    );
  }

  if (!showBadge || !profile.verified) return body;

  const badge = Math.max(14, Math.round(size * 0.28));
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {body}
      <span
        className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-[#0a0a0a] text-[#1d9bf0]"
        style={{ width: badge + 2, height: badge + 2 }}
        title="Đã xác thực"
      >
        <BadgeCheck className="fill-[#1d9bf0] text-white" style={{ width: badge, height: badge }} />
      </span>
    </span>
  );
}

/** Avatar chỉ từ username (bình luận) — có ảnh hoặc chữ cái */
export function CommentAvatar({
  username,
  avatar,
  size = 32,
  verified,
}: {
  username: string;
  avatar?: string | null;
  size?: number;
  verified?: boolean;
}) {
  return (
    <UserAvatar
      profile={{
        name: username,
        avatar: avatar || undefined,
        avatarPosition: "50% 50%",
        verified: !!verified,
      }}
      size={size}
      showBadge={!!verified}
    />
  );
}
