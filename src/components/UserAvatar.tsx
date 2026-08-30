"use client";

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { getAvatarFrame } from "@/lib/settings";

interface UserAvatarProps {
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
}: UserAvatarProps) {
  const frameId = profile?.avatarFrame || profile?.frameId;
  const frame = getAvatarFrame(frameId);
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

export { UserAvatar };

interface CommentAvatarProps {
  avatar?: string | null;
  name?: string | null;
  avatarFrame?: string | null;
  frameId?: string | null;
  profile?: any | null;
  size?: number;
  className?: string;
  [key: string]: any;
}

export function CommentAvatar({
  avatar,
  name,
  avatarFrame,
  frameId,
  profile,
  size = 32,
  className = "",
  ...rest
}: CommentAvatarProps) {
  const actualAvatar = avatar ?? profile?.avatar ?? null;
  const actualName = name ?? profile?.name ?? "User";
  const actualFrameId = avatarFrame ?? frameId ?? profile?.avatarFrame ?? profile?.frameId ?? null;

  const frame = getAvatarFrame(actualFrameId);
  const hasFrame = Boolean(frame && frame.css && frame.css !== "none" && frame.id !== "frame:none");
  const pad = hasFrame ? Math.max(2, Math.round(size * 0.06)) : 0;
  const inner = Math.max(0, size - pad * 2);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: hasFrame ? frame?.css : undefined,
        padding: pad,
      }}
      title={actualName}
      {...rest}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-white/10 text-neutral-300"
        style={{ width: inner, height: inner }}
      >
        {actualAvatar ? (
          <img
            src={actualAvatar}
            alt={actualName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <User className="w-1/2 h-1/2 text-neutral-400" />
        )}
      </div>
    </div>
  );
}
