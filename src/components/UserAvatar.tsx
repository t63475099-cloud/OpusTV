"use client";

import { useEffect, useState } from "react";
import {
  isPresetAvatar,
  presetGradient,
  getLqAvatarUrl,
  getAvatarFrame,
  type UserProfile,
  type FrameEffect,
} from "@/lib/settings";
import { User, BadgeCheck } from "lucide-react";

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

function FrameParticles({
  effect,
  color,
  size,
}: {
  effect: FrameEffect;
  color?: string;
  size: number;
}) {
  if (effect === "none" || effect === "pulse" || effect === "spin") return null;
  const c = color || "#fbbf24";
  const n = effect === "particle" || effect === "spark" ? 10 : 6;
  return (
    <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`avatar-particle avatar-particle--${effect}`}
          style={
            {
              "--i": i,
              "--c": c,
              "--s": `${size}px`,
            } as React.CSSProperties
          }
        />
      ))}
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
  const hasFrame = !!(frame && frame.src && frame.id !== "frame:none");
  const effect: FrameEffect = (frame?.effect as FrameEffect) || "none";
  const [morph, setMorph] = useState(false);

  useEffect(() => {
    if (effect !== "morph" || !frame?.srcAlt) return;
    const t = setInterval(() => setMorph((m) => !m), 2800);
    return () => clearInterval(t);
  }, [effect, frame?.srcAlt]);

  const inner = hasFrame ? Math.round(size * 0.72) : size;
  const pad = hasFrame ? Math.round((size - inner) / 2) : 0;

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

  const badge = Math.max(14, Math.round(size * 0.28));
  const frameSrc =
    effect === "morph" && morph && frame?.srcAlt ? frame.srcAlt : frame?.src;

  const effectClass =
    effect === "spin"
      ? "avatar-fx-spin"
      : effect === "pulse"
        ? "avatar-fx-pulse"
        : effect === "flame"
          ? "avatar-fx-flame"
          : effect === "ice"
            ? "avatar-fx-ice"
            : effect === "neon"
              ? "avatar-fx-neon"
              : effect === "rainbow"
                ? "avatar-fx-rainbow"
                : effect === "orbit"
                  ? "avatar-fx-orbit"
                  : "";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center${hasFrame ? " avatar-frame-wrap" : ""}`}
      style={
        {
          width: size,
          height: size,
          ["--frame-color" as string]: frame?.color || "#fbbf24",
        } as React.CSSProperties
      }
    >
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ padding: pad }}
      >
        {face}
      </span>
      {hasFrame && frameSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frameSrc}
          alt=""
          data-frame="1"
          className={`pointer-events-none absolute inset-0 h-full w-full select-none transition-opacity duration-700 ${effectClass}`}
          draggable={false}
        />
      )}
      {hasFrame && (
        <FrameParticles effect={effect} color={frame?.color} size={size} />
      )}
      {showBadge && profile.verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center rounded-full bg-[#0a0a0a] text-[#1d9bf0]"
          style={{ width: badge + 2, height: badge + 2 }}
          title="Đã xác thực"
        >
          <BadgeCheck
            className="fill-[#1d9bf0] text-white"
            style={{ width: badge, height: badge }}
          />
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
