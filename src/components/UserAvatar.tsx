"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { getAvatarFrame } from "@/lib/settings";
import { useAccountStore } from "@/lib/account";

interface UserAvatarProps {
  profile?: any | null;
  size?: number;
  className?: string;
  showBadge?: boolean;
}

export default function UserAvatar({
  profile: propProfile = null,
  size = 36,
  className = "",
  showBadge = false,
}: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const [localData, setLocalData] = useState<any>(null);

  // Lấy dữ liệu từ useAccountStore
  const storeData = useAccountStore((state: any) => {
    if (!state) return null;
    return state.account || state.profile || state.user || state;
  });

  useEffect(() => {
    setMounted(true);
    const readStorage = () => {
      try {
        const stored =
          localStorage.getItem("opustv_account") ||
          localStorage.getItem("opustv_user") ||
          localStorage.getItem("user_profile") ||
          localStorage.getItem("profile");
        if (stored) {
          setLocalData(JSON.parse(stored));
        }
      } catch {
        setLocalData(null);
      }
    };

    readStorage();
    window.addEventListener("storage", readStorage);
    window.addEventListener("user-updated", readStorage);
    window.addEventListener("account-updated", readStorage);
    window.addEventListener("profile-updated", readStorage);

    return () => {
      window.removeEventListener("storage", readStorage);
      window.removeEventListener("user-updated", readStorage);
      window.removeEventListener("account-updated", readStorage);
      window.removeEventListener("profile-updated", readStorage);
    };
  }, []);

  // Ưu tiên: prop truyền vào > Store Zustand > LocalStorage
  const user = propProfile || storeData || localData;

  const avatarUrl =
    user?.avatar ||
    user?.avatarUrl ||
    user?.photoURL ||
    user?.image ||
    null;

  const frameId =
    user?.avatarFrame ||
    user?.frameId ||
    user?.frame ||
    null;

  const frame = frameId ? getAvatarFrame(frameId) : null;
  const hasFrame = Boolean(
    frame && frame.css && frame.css !== "none" && frame.id !== "frame:none"
  );
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
      title={user?.name || user?.username || "Tài khoản của bạn"}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-white/10 text-neutral-300 relative shadow-inner"
        style={{ width: inner, height: inner }}
      >
        {mounted && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || "Avatar"}
            className="w-full h-full object-cover select-none"
            loading="eager"
            onError={(e) => {
              // Dự phòng khi link ảnh bị lỗi
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <User className="w-1/2 h-1/2 text-neutral-400" />
        )}
      </div>

      {showBadge && user?.badge && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950 shadow-sm" />
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
  const actualAvatar = avatar ?? profile?.avatar ?? profile?.avatarUrl ?? null;
  const actualName = name ?? profile?.name ?? profile?.username ?? "User";
  const actualFrameId =
    avatarFrame ?? frameId ?? profile?.avatarFrame ?? profile?.frameId ?? null;

  const frame = actualFrameId ? getAvatarFrame(actualFrameId) : null;
  const hasFrame = Boolean(
    frame && frame.css && frame.css !== "none" && frame.id !== "frame:none"
  );
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
