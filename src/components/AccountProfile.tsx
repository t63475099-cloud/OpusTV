"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  LogOut,
  Coins,
  User,
  Shield,
  Monitor,
  BadgeCheck,
  RefreshCw,
  Gift,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import { useEventStore, formatCoins, getVipProgress } from "@/lib/eventCoins";
import UserAvatar from "@/components/UserAvatar";
import SessionManager from "@/components/SessionManager";
import VerifyRequestModal from "@/components/VerifyRequestModal";

type Tab = "wallet" | "profile" | "security" | "sessions";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "wallet", label: "Ví xu", icon: Coins },
  { id: "profile", label: "Hồ sơ", icon: User },
  { id: "security", label: "Bảo mật", icon: Shield },
  { id: "sessions", label: "Thiết bị", icon: Monitor },
];

export default function AccountProfile() {
  const username = useAccountStore((s) => s.username);
  const lastSyncAt = useAccountStore((s) => s.lastSyncAt);
  const logout = useAccountStore((s) => s.logout);
  const syncNow = useAccountStore((s) => s.syncNow);

  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setAvatar = useSettingsStore((s) => s.setAvatar);

  const coins = useEventStore((s) => s.coins);
  const totalEarned = useEventStore((s) => s.totalEarned);
  const vipPoints = useEventStore((s) => s.vipPoints || 0);
  const isVipActive = useEventStore((s) => s.isVipActive);
  const vipProg = getVipProgress(vipPoints);

  const [tab, setTab] = useState<Tab>("wallet");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [uidCopied, setUidCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showName = (profile.name || username || "").trim() || "—";

  useEffect(() => {
    setEditName(profile.name ?? "");
    setEditBio(profile.bio ?? "");
  }, [profile.name, profile.bio]);

  /** Kéo dữ liệu cloud ngay khi mở profile (xu / VIP / UID) */
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        await useAccountStore.getState().refreshMe();
        await syncNow();
      } catch {
        /* */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, syncNow]);

  useEffect(() => {
    if (!username) return;
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (c || !data?.ok || !data.user) return;
        if (data.user.uid) {
          updateProfile({
            uid: String(data.user.uid),
            verified: data.user.verified ?? profile.verified,
          });
        }
      } catch {
        /* */
      }
    })();
    return () => {
      c = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const onAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new window.Image();
      img.onload = async () => {
        const size = 192;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.72), "50% 50%");
        setMsg("Đã cập nhật ảnh");
        const r = await syncNow();
        if (!r.ok) setErr("Đồng bộ ảnh chưa thành công");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setErr("");
    setMsg("");
    updateProfile({
      name: editName.trim().slice(0, 48) || profile.name,
      bio: editBio.trim().slice(0, 160),
    });
    setSyncing(true);
    const r = await syncNow();
    setSyncing(false);
    if (r.ok) setMsg("Đã lưu");
    else setErr(r.error || "Lưu lỗi");
  };

  const manualSync = useCallback(async () => {
    setSyncing(true);
    setErr("");
    setMsg("");
    const r = await syncNow();
    setSyncing(false);
    if (r.ok) setMsg("Đã đồng bộ");
    else setErr(r.error || "Đồng bộ lỗi");
  }, [syncNow]);

  return (
    <div className="min-h-[100dvh] pb-28 pt-14 px-3 sm:px-4">
      <div className="mx-auto w-full max-w-lg">
        {/* Header */}
        <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative"
              aria-label="Đổi ảnh"
            >
              <UserAvatar
                profile={{ ...profile, name: showName }}
                size={88}
                showBadge={!!profile.verified}
              />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatar(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white">{showName}</h1>
              {profile.verified ? (
                <BadgeCheck className="h-5 w-5 text-sky-400" />
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">@{username}</p>
            {profile.uid ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(String(profile.uid));
                    setUidCopied(true);
                    window.setTimeout(() => setUidCopied(false), 1500);
                  } catch {
                    /* */
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
              >
                UID {profile.uid}
                {uidCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            ) : null}
            <button
              type="button"
              disabled={syncing}
              onClick={() => void manualSync()}
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              {lastSyncAt
                ? `Đồng bộ: ${new Date(lastSyncAt).toLocaleString("vi-VN")}`
                : "Đồng bộ"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3 flex gap-1 overflow-x-auto scrollbar-hide rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-[10px] font-medium transition duration-300 ${
                  on ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Ví xu */}
        {tab === "wallet" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200/70">
                Số dư
              </p>
              <p className="mt-1 break-all text-3xl font-bold tabular-nums tracking-tight text-amber-300 sm:text-4xl">
                {formatCoins(coins)}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Tổng đã nhận:{" "}
                <span className="tabular-nums text-zinc-200">{formatCoins(totalEarned)}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-zinc-400">VIP {vipProg.level}</span>
                <span className="tabular-nums text-zinc-300">
                  {formatCoins(vipProg.earned)}/{formatCoins(vipProg.next.need)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, vipProg.pct || 0)}%` }}
                />
              </div>
              {isVipActive() ? (
                <p className="mt-2 text-[11px] text-amber-300">VIP đang bật</p>
              ) : null}
            </div>

            <Link
              href="/su-kien"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Gift className="h-4 w-4 text-rose-400" />
              Sự kiện
            </Link>
          </div>
        ) : null}

        {/* Hồ sơ */}
        {tab === "profile" ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <label className="block space-y-1.5">
              <span className="text-[11px] text-zinc-500">Tên hiển thị</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 48))}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-rose-500/50"
                maxLength={48}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] text-zinc-500">Giới thiệu</span>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-rose-500/50"
                maxLength={160}
              />
            </label>
            <button
              type="button"
              onClick={() => void saveProfile()}
              className="h-11 w-full rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Lưu
            </button>
            {!profile.verified ? (
              <button
                type="button"
                onClick={() => setVerifyOpen(true)}
                className="h-10 w-full rounded-xl border border-sky-500/30 text-sm text-sky-300 transition hover:bg-sky-500/10"
              >
                Yêu cầu xác minh
              </button>
            ) : (
              <p className="text-center text-xs text-sky-400">Đã xác minh</p>
            )}
          </div>
        ) : null}

        {/* Bảo mật */}
        {tab === "security" ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-300">@{username}</p>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        ) : null}

        {/* Phiên thiết bị */}
        {tab === "sessions" ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <SessionManager />
          </div>
        ) : null}

        {err ? <p className="mt-3 text-center text-sm text-red-400">{err}</p> : null}
        {msg ? <p className="mt-3 text-center text-sm text-emerald-400">{msg}</p> : null}
      </div>

      <VerifyRequestModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        verified={!!profile.verified}
        onVerifiedChange={(v) => updateProfile({ verified: v })}
      />
    </div>
  );
}
