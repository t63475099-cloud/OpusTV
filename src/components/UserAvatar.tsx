"use client";

import {
  isPresetAvatar,
  presetGradient,
} from "@/lib/settings";
import { BadgeCheck } from "lucide-react";

interface AvatarProfileData {
  name: string;
  avatar?: string | null;
  avatarPosition?: string;
  verified?: boolean;
}

interface Props {
  profile: AvatarProfileData;
  size?: number;
  className?: string;
  ring?: boolean;
  showBadge?: boolean;
}

const GRADIENTS = [
  "from-rose-500 to-red-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getGradientByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
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
        className={`rounded-full object-cover bg-zinc-800 shrink-0 ${ringCls} ${className}`}
        style={style}
      />
    );
  } else if (profile.avatar && isPresetAvatar(profile.avatar)) {
    const letter = (profile.name || "?").charAt(0).toUpperCase();
    body = (
      <div
        className={`rounded-full bg-gradient-to-br ${presetGradient(
          profile.avatar
        )} flex items-center justify-center text-white font-bold select-none shrink-0 ${ringCls} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {letter}
      </div>
    );
  } else {
    const letter = (profile.name || "?").charAt(0).toUpperCase();
    const bgGrad = getGradientByName(profile.name || "User");
    body = (
      <div
        className={`rounded-full bg-gradient-to-br ${bgGrad} flex items-center justify-center text-white font-bold select-none shrink-0 shadow-md ${ringCls} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {letter}
      </div>
    );
  }

  if (!showBadge) return body;

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

/** Avatar cho bình luận */
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
