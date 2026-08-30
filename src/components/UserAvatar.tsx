"use client";

import { isPresetAvatar, presetGradient } from "@/lib/settings";
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
  liquidRing?: boolean;
  showBadge?: boolean;
}

export default function UserAvatar({
  profile,
  size = 40,
  className = "",
  ring = false,
  liquidRing = false,
  showBadge = false,
}: Props) {
  const innerSize = size - 6;

  const renderContent = () => {
    if (profile.avatar && !isPresetAvatar(profile.avatar)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar}
          alt={profile.name || "Avatar"}
          className={`rounded-full object-cover z-10 transition-transform duration-500 hover:scale-105 ${className}`}
          style={{ width: innerSize, height: innerSize, objectPosition: profile.avatarPosition || "50% 50%" }}
        />
      );
    }

    const letter = (profile.name || "?").charAt(0).toUpperCase();
    const gradient = profile.avatar && isPresetAvatar(profile.avatar) 
      ? presetGradient(profile.avatar) 
      : "from-rose-500 via-purple-600 to-blue-600";

    return (
      <div
        className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold select-none z-10 shadow-inner ${className}`}
        style={{ width: innerSize, height: innerSize, fontSize: size * 0.38 }}
      >
        {letter}
      </div>
    );
  };

  let body: React.ReactNode;

  if (liquidRing) {
    body = (
      <div
        className="relative flex items-center justify-center rounded-full p-[3px] liquid-ring shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-transform duration-300 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-[3px] bg-[#0a0a0c] rounded-full z-0 backdrop-blur-md" />
        {renderContent()}
      </div>
    );
  } else {
    const ringCls = ring ? "ring-2 ring-rose-500/50 ring-offset-2 ring-offset-[#050508] shadow-lg" : "";
    body = (
      <div className={`relative rounded-full transition-transform duration-300 hover:scale-105 ${ringCls}`} style={{ width: size, height: size }}>
        {renderContent()}
      </div>
    );
  }

  if (!showBadge) return body;

  const badgeSize = Math.max(14, Math.round(size * 0.28));
  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {body}
      <div
        className="absolute -bottom-0.5 -right-0.5 z-20 flex items-center justify-center rounded-full bg-[#050508] text-[#1d9bf0] shadow-md ring-2 ring-[#050508]"
        style={{ width: badgeSize + 4, height: badgeSize + 4 }}
        title="Đã xác thực"
      >
        <BadgeCheck className="fill-[#1d9bf0] text-white" style={{ width: badgeSize, height: badgeSize }} />
      </div>
    </div>
  );
}
