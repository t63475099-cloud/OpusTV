"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { getAvatarFrame } from "@/lib/settings";

interface Props {
  profile?: any | null;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export default function UserAvatar({
  profile = null,
  size = 36,
  className = "",
  showBadge = false,
}: Props) {
  // Sử dụng optional chaining (?.) để tránh crash khi profile là null lúc build tĩnh trên Vercel
  const frame = getAvatarFrame(profile?.avatarFrame);
  const hasFrame = Boolean(frame && frame.css && frame.css !== "none" && frame.id !== "frame:none");
  const pad = hasFrame ? Math.max(3, Math.round(size * 0.06)) : 0;
  const inner = Math.max(0, size - pad * 2);

  return (
    <Link
      href="/tai-khoan"
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{
        width: size,
        height: size,
        background: hasFrame ? frame?.css : undefined,
        padding: pad,
      }}
      title={profile?.name || "Tài khoản"}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-white/10 text-neutral-300"
        style={{ width: inner, height: inner }}
      >
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name || "Avatar"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-neutral-400" />
        )}
      </div>

      {showBadge && profile?.badge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
      )}
    </Link>
  );
}
