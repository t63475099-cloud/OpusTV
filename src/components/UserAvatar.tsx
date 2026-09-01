"use client";

import {
  isPresetAvatar,
  presetGradient,
  getLqAvatarUrl,
  getAvatarFrame,
  type UserProfile,
} from "@/lib/settings";
import { User } from "lucide-react";

interface Props {
  profile: Pick<
    UserProfile,
    "name" | "avatar" | "avatarPosition" | "verified" | "avatarFrame"
  >;
  size?: number;
  className?: string;
  ring?: boolean;
  showBadge?: boolean;
}

/** Huy hiệu tích xanh kiểu Instagram / TikTok */
export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="Đã xác minh"
      aria-label="Đã xác minh"
    >
      <svg viewBox="0 0 24 24" width={size} height={size} className="block" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
        <path
          d="M10.1 15.9 7 12.8l1.4-1.4 1.7 1.7 5-5.1L16.5 9.4z"
          fill="#fff"
        />
      </svg>
    </span>
  );
}

export default function UserAvatar({
  profile,
  size = 40,
  className = "",
  ring = false,
  showBadge = false,
}: Props) {
  const frame = getAvatarFrame(profile.avatarFrame);
  const hasFrame = !!(frame && frame.css && frame.css !== "none" && frame.id !== "frame:none");
  const pad = hasFrame ? Math.max(3, Math.round(size * 0.06)) : 0;
  const inner = size - pad * 2;

  const imgStyle: React.CSSProperties = {
    width: inner,
    height: inner,
    objectPosition: profile.avatarPosition || "50% 50%",
  };

  const ringCls =
    ring && !hasFrame
      ? "ring-2 ring-red-500/60 ring-offset-2 ring-offset-[#0a0a0a]"
      : "";

  const lqUrl = getLqAvatarUrl(profile.avatar);
  const imgSrc =
    lqUrl ||
    (profile.avatar && !isPresetAvatar(profile.avatar) ? profile.avatar : null);

  let face: React.ReactNode;
  if (imgSrc) {
    face = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgSrc}
        alt={profile.name || "Avatar"}
        className={`rounded-full object-cover bg-zinc-800 ${ringCls} ${className}`}
        style={imgStyle}
        referrerPolicy="no-referrer"
      />
    );
  } else if (isPresetAvatar(profile.avatar)) {
    const letter = (profile.name || "?").charAt(0).toUpperCase();
    face = (
      <div
        className={`rounded-full bg-gradient-to-br ${presetGradient(
          profile.avatar
        )} flex items-center justify-center text-white font-bold select-none ${ringCls} ${className}`}
        style={{ width: inner, height: inner, fontSize: inner * 0.4 }}
      >
        {letter}
      </div>
    );
  } else {
    face = (
      <div
        className={`rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 ${ringCls} ${className}`}
        style={{ width: inner, height: inner }}
      >
        <User style={{ width: inner * 0.45, height: inner * 0.45 }} />
      </div>
    );
  }

  const badge = Math.max(16, Math.round(size * 0.3));
  const frameClass = hasFrame ? `ab-frame--${frame.css}` : "";

  return (
    <span
      className={`ab-wrap relative ${frameClass}`}
      style={{ width: size, height: size }}
    >
      <span className="ab-face" style={{ width: inner, height: inner }}>
        {face}
      </span>
      {hasFrame && <span className="ab-ring" aria-hidden />}
      {showBadge && profile.verified && (
        <span
          className="absolute z-10"
          style={{
            width: badge,
            height: badge,
            right: -2,
            bottom: -2,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.55))",
          }}
        >
          <VerifiedBadge size={badge} />
        </span>
      )}
    </span>
  );
}

export function CommentAvatar({
  username,
  avatar,
  size = 32,
  verified,
  avatarFrame,
}: {
  username: string;
  avatar?: string | null;
  size?: number;
  verified?: boolean;
  avatarFrame?: string;
}) {
  return (
    <UserAvatar
      profile={{
        name: username,
        avatar: avatar || undefined,
        avatarPosition: "50% 50%",
        verified: !!verified,
        avatarFrame,
      }}
      size={size}
      showBadge={!!verified}
    />
  );
}
