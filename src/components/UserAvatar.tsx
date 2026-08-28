"use client";

import {
  isPresetAvatar,
  presetGradient,
  type UserProfile,
} from "@/lib/settings";
import { User } from "lucide-react";

interface Props {
  profile: Pick<UserProfile, "name" | "avatar" | "avatarPosition">;
  size?: number;
  className?: string;
  ring?: boolean;
}

export default function UserAvatar({
  profile,
  size = 40,
  className = "",
  ring = false,
}: Props) {
  const style = {
    width: size,
    height: size,
    objectPosition: profile.avatarPosition || "50% 50%",
  };

  const ringCls = ring
    ? "ring-2 ring-red-500/60 ring-offset-2 ring-offset-[#0a0a0a]"
    : "";

  if (profile.avatar && !isPresetAvatar(profile.avatar)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar}
        alt={profile.name || "Avatar"}
        className={`rounded-full object-cover bg-zinc-800 ${ringCls} ${className}`}
        style={style}
      />
    );
  }

  if (isPresetAvatar(profile.avatar)) {
    const letter = (profile.name || "?").charAt(0).toUpperCase();
    return (
      <div
        className={`rounded-full bg-gradient-to-br ${presetGradient(
          profile.avatar
        )} flex items-center justify-center text-white font-bold select-none ${ringCls} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {letter}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 ${ringCls} ${className}`}
      style={{ width: size, height: size }}
    >
      <User style={{ width: size * 0.45, height: size * 0.45 }} />
    </div>
  );
}
