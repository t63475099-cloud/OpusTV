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

// Hàm bóc tách avatar và khung viền từ mọi định dạng object (kể cả Zustand persist { state: ... })
function extractUserData(data: any) {
  if (!data || typeof data !== "object") return { avatar: null, frameId: null, name: "" };

  const unwrapped = data.state ? { ...data, ...data.state } : data;
  const inner = unwrapped.profile || unwrapped.account || unwrapped.user || unwrapped.settings || {};
  const merged = { ...unwrapped, ...inner };

  const avatar =
    merged.customAvatar ||
    merged.avatar ||
    merged.avatarUrl ||
    merged.photoURL ||
    merged.image ||
    merged.picture ||
    null;

  const frameId =
    merged.avatarFrame ||
    merged.frameId ||
    merged.frame ||
    merged.selectedFrame ||
    null;

  const name =
    merged.name ||
    merged.username ||
    merged.displayName ||
    merged.fullName ||
    merged.email ||
    "Tài khoản";

  return { avatar, frameId, name };
}

export default function UserAvatar({
  profile: propProfile = null,
  size = 36,
  className = "",
  showBadge = false,
}: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const [syncedUser, setSyncedUser] = useState<any>({ avatar: null, frameId: null, name: "" });

  // 1. Lấy dữ liệu từ Zustand store
  const storeAccount = useAccountStore((state: any) => state?.profile || state?.user || state?.account || state);
  const storeSettings = useSettingsStore((state: any) => state?.settings || state);

  const syncAllSources = async () => {
    let foundAvatar: string | null = null;
    let foundFrame: string | null = null;
    let foundName = "Tài khoản";

    // A. Kiểm tra prop truyền vào
    if (propProfile) {
      const parsed = extractUserData(propProfile);
      if (parsed.avatar) foundAvatar = parsed.avatar;
      if (parsed.frameId) foundFrame = parsed.frameId;
      if (parsed.name) foundName = parsed.name;
    }

    // B. Kiểm tra Zustand stores
    if (!foundAvatar || !foundFrame) {
      const fromAcc = extractUserData(storeAccount);
      const fromSet = extractUserData(storeSettings);
      if (!foundAvatar) foundAvatar = fromAcc.avatar || fromSet.avatar;
      if (!foundFrame) foundFrame = fromAcc.frameId || fromSet.frameId;
      if (foundName === "Tài khoản") foundName = fromAcc.name || fromSet.name;
    }

    // C. Quét toàn bộ các key trong LocalStorage
    if (typeof window !== "undefined") {
      const storageKeys = [
        "opustv-settings",
        "opustv-account",
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

      for (const key of storageKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = extractUserData(JSON.parse(raw));
            if (!foundAvatar && parsed.avatar) foundAvatar = parsed.avatar;
            if (!foundFrame && parsed.frameId) foundFrame = parsed.frameId;
            if (foundName === "Tài khoản" && parsed.name) foundName = parsed.name;
          }
        } catch {}
      }

      // D. Nếu vẫn chưa có, gọi API kiểm tra Session đăng nhập
      if (!foundAvatar) {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            const parsed = extractUserData(json?.user || json?.profile || json);
            if (parsed.avatar) foundAvatar = parsed.avatar;
            if (parsed.frameId && !foundFrame) foundFrame = parsed.frameId;
            if (parsed.name && foundName === "Tài khoản") foundName = parsed.name;
          }
        } catch {}
      }
    }

    setSyncedUser({ avatar: foundAvatar, frameId: foundFrame, name: foundName });
  };

  useEffect(() => {
    setMounted(true);
    syncAllSources();

    const handleEvent = () => syncAllSources();
    window.addEventListener("storage", handleEvent);
    window.addEventListener("focus", handleEvent);
    window.addEventListener("user-updated", handleEvent);
    window.addEventListener("account-updated", handleEvent);
    window.addEventListener("profile-updated", handleEvent);
    window.addEventListener("settings-updated", handleEvent);

    return () => {
      window.removeEventListener("storage", handleEvent);
      window.removeEventListener("focus", handleEvent);
      window.removeEventListener("user-updated", handleEvent);
      window.removeEventListener("account-updated", handleEvent);
      window.removeEventListener("profile-updated", handleEvent);
      window.removeEventListener("settings-updated", handleEvent);
    };
  }, [storeAccount, storeSettings, propProfile]);

  const frame = syncedUser.frameId ? getAvatarFrame(syncedUser.frameId) : null;
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
      title={syncedUser.name || "Tài khoản của bạn"}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-white/10 text-neutral-300 relative shadow-inner"
        style={{ width: inner, height: inner }}
      >
        {mounted && syncedUser.avatar ? (
          <img
            src={syncedUser.avatar}
            alt={syncedUser.name || "Avatar"}
            className="w-full h-full object-cover select-none"
            loading="eager"
            onError={() => {
              setSyncedUser((prev: any) => ({ ...prev, avatar: null }));
            }}
          />
        ) : (
          <User className="w-1/2 h-1/2 text-neutral-400" />
        )}
      </div>

      {showBadge && (
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
