"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { getAvatarFrame, useSettingsStore } from "@/lib/settings";
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
  const [localData, setLocalData] = useState<any>({});

  // 1. Lắng nghe Zustand Stores
  const settings = useSettingsStore((state: any) => state?.settings || state || {});
  const account = useAccountStore((state: any) => state?.profile || state?.user || state?.account || state || {});

  // 2. Đọc và hợp nhất toàn bộ dữ liệu từ LocalStorage
  const readAllStorages = () => {
    if (typeof window === "undefined") return;
    try {
      const storageKeys = [
        "opustv-settings",
        "opustv_settings",
        "opustv_account",
        "opustv_user",
        "opustv_profile",
        "user_profile",
        "user_settings",
        "profile",
        "settings",
        "account",
      ];

      let merged: any = {};
      for (const key of storageKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            merged = { ...merged, ...(parsed?.settings || parsed?.profile || parsed?.user || parsed) };
          } catch {
            // bỏ qua lỗi parse
          }
        }
      }
      setLocalData(merged);
    } catch {
      setLocalData({});
    }
  };

  useEffect(() => {
    setMounted(true);
    readAllStorages();

    // Đăng ký lắng nghe các sự kiện cập nhật
    const handleUpdate = () => readAllStorages();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("user-updated", handleUpdate);
    window.addEventListener("account-updated", handleUpdate);
    window.addEventListener("profile-updated", handleUpdate);
    window.addEventListener("settings-updated", handleUpdate);

    // Lắng nghe thay đổi trực tiếp từ store (nếu có hỗ trợ subscribe)
    const unsubSettings = (useSettingsStore as any)?.subscribe?.(readAllStorages);
    const unsubAccount = (useAccountStore as any)?.subscribe?.(readAllStorages);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("user-updated", handleUpdate);
      window.removeEventListener("account-updated", handleUpdate);
      window.removeEventListener("profile-updated", handleUpdate);
      window.removeEventListener("settings-updated", handleUpdate);
      if (typeof unsubSettings === "function") unsubSettings();
      if (typeof unsubAccount === "function") unsubAccount();
    };
  }, []);

  // 3. Trích xuất URL Avatar theo thứ tự ưu tiên
  const avatarUrl =
    propProfile?.customAvatar ||
    propProfile?.avatar ||
    propProfile?.avatarUrl ||
    settings?.customAvatar ||
    settings?.avatar ||
    settings?.avatarUrl ||
    account?.customAvatar ||
    account?.avatar ||
    account?.avatarUrl ||
    account?.photoURL ||
    account?.image ||
    localData?.customAvatar ||
    localData?.avatar ||
    localData?.avatarUrl ||
    localData?.photoURL ||
    localData?.image ||
    null;

  // 4. Trích xuất Khung Viền theo thứ tự ưu tiên
  const frameId =
    propProfile?.avatarFrame ||
    propProfile?.frameId ||
    propProfile?.frame ||
    settings?.avatarFrame ||
    settings?.frameId ||
    settings?.frame ||
    account?.avatarFrame ||
    account?.frameId ||
    localData?.avatarFrame ||
    localData?.frameId ||
    localData?.frame ||
    null;

  const displayName =
    propProfile?.name ||
    propProfile?.username ||
    account?.name ||
    account?.username ||
    settings?.name ||
    localData?.name ||
    localData?.username ||
    "Tài khoản";

  const frame = frameId ? getAvatarFrame(frameId) : null;
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
      title={displayName}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-white/10 text-neutral-300 relative shadow-inner"
        style={{ width: inner, height: inner }}
      >
        {mounted && avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover select-none"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <User className="w-1/2 h-1/2 text-neutral-400" />
        )}
      </div>

      {showBadge && (propProfile?.badge || account?.badge || localData?.badge) && (
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
  const actualAvatar = avatar ?? profile?.customAvatar ?? profile?.avatar ?? profile?.avatarUrl ?? null;
  const actualName = name ?? profile?.name ?? profile?.username ?? "User";
  const actualFrameId = avatarFrame ?? frameId ?? profile?.avatarFrame ?? profile?.frameId ?? null;

  const frame = actualFrameId ? getAvatarFrame(actualFrameId) : null;
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
