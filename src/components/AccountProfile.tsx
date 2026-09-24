"use client";

/**
 * Hồ sơ cá nhân — phong cách Instagram / Zalo / Messenger
 * Flat dark, responsive mobile → desktop, đồng bộ store OpusFilm
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Camera,
  Copy,
  Check,
  Pencil,
  Mail,
  ChevronRight,
  Film,
  MessageCircle,
  Code2,
  Gift,
  Shield,
  History,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore, AVATAR_FRAMES } from "@/lib/settings";
import { useEventStore, formatCoins, getVipProgress } from "@/lib/eventCoins";
import { useXpStore } from "@/lib/xpStore";
import { useStreakStore } from "@/lib/streak";
import UserAvatar, { VerifiedBadge } from "@/components/UserAvatar";
import SessionManager from "@/components/SessionManager";
import VerifyRequestModal from "@/components/VerifyRequestModal";

type Tab = "services" | "frames" | "security";

const TABS: { id: Tab; label: string }[] = [
  { id: "services", label: "Dịch vụ" },
  { id: "frames", label: "Khung ảnh" },
  { id: "security", label: "Bảo mật" },
];

const FRAME_LABELS: Record<string, string> = {
  "frame:none": "Không khung",
  "frame:conic-rainbow": "Vòng cầu vồng",
  "frame:celestial-halo": "Hào quang",
  "frame:flame-ring": "Vòng lửa",
  "frame:mystic-frost": "Băng giá",
  "frame:galaxy-nebula": "Ngân hà",
  "frame:solid-gold": "Vàng kim",
  "frame:platinum-sweep": "Bạch kim",
  "frame:diamond-sparkle": "Kim cương",
  "frame:neon-flicker": "Viền xanh",
  "frame:lunar-eclipse": "Trăng",
  "frame:solar-eclipse": "Mặt trời",
  "frame:antique-bronze": "Đồng",
};

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(id);
  }, [onDone, text]);

  return (
    <div
      role="status"
      className="fixed left-1/2 z-[200] max-w-[90vw] -translate-x-1/2 rounded-full border border-[#27272a] bg-[#1c1c1e] px-4 py-2.5 text-sm font-medium text-white shadow-2xl"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {text}
    </div>
  );
}

function vipSubtitle(level: number) {
  if (level >= 15) return "Huyền thoại";
  if (level >= 10) return "Cao cấp";
  if (level >= 5) return "Thành viên";
  return "Tân thủ";
}

export default function AccountProfile() {
  const router = useRouter();
  const username = useAccountStore((s) => s.username);
  const lastSyncAt = useAccountStore((s) => s.lastSyncAt);
  const logout = useAccountStore((s) => s.logout);
  const syncNow = useAccountStore((s) => s.syncNow);

  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setAvatar = useSettingsStore((s) => s.setAvatar);

  const coins = useEventStore((s) => s.coins);
  const vipPoints = useEventStore((s) => s.vipPoints || 0);
  const vipProg = getVipProgress(vipPoints);
  const isVipActive = useEventStore((s) => s.isVipActive);
  const xp = useXpStore((s) => s.summary());
  const streak = useStreakStore((s) => s.current || 0);

  const [tab, setTab] = useState<Tab>("services");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showName = (profile.name || username || "").trim() || "Người dùng";
  const handle = username ? `@${username}` : "";

  const frameList = useMemo(() => {
    const order = [
      "frame:none",
      "frame:conic-rainbow",
      "frame:celestial-halo",
      "frame:flame-ring",
      "frame:mystic-frost",
      "frame:solid-gold",
      "frame:platinum-sweep",
      "frame:diamond-sparkle",
      "frame:neon-flicker",
      "frame:lunar-eclipse",
      "frame:solar-eclipse",
      "frame:antique-bronze",
    ];
    const map = new Map(AVATAR_FRAMES.map((f) => [f.id, f]));
    return order.map((id) => map.get(id)).filter(Boolean) as typeof AVATAR_FRAMES;
  }, []);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    setEditName(profile.name ?? "");
    setEditBio(profile.bio ?? "");
  }, [profile.name, profile.bio]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        await useAccountStore.getState().refreshMe?.();
        await syncNow();
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username, syncNow]);

  const onPickAvatar = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new window.Image();
      img.onload = async () => {
        const size = 192;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          size,
          size
        );
        setAvatar(canvas.toDataURL("image/jpeg", 0.72), "50% 50%");
        showToast("Đã cập nhật ảnh đại diện");
        await syncNow();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const copyUid = async () => {
    const uid = String(profile.uid || "").trim();
    if (!uid) {
      showToast("Chưa có UID");
      return;
    }
    try {
      await navigator.clipboard.writeText(uid);
      showToast("Đã sao chép UID kết bạn");
    } catch {
      prompt("UID:", uid);
    }
  };

  const doSync = async () => {
    setSyncing(true);
    const r = await syncNow();
    setSyncing(false);
    showToast(r.ok ? "Đã đồng bộ dữ liệu" : "Đồng bộ chưa thành công");
  };

  const saveProfile = async () => {
    updateProfile({
      name: editName.trim().slice(0, 40) || profile.name,
      bio: editBio.trim().slice(0, 100),
    });
    const r = await syncNow();
    showToast(r.ok ? "Đã lưu hồ sơ" : "Đã lưu trên máy này");
  };

  const selectFrame = async (id: string) => {
    updateProfile({ avatarFrame: id });
    showToast("Đã đổi khung ảnh");
    await syncNow();
  };

  const savePin = () => {
    if (!/^\d{6}$/.test(pin)) {
      showToast("PIN cần đúng 6 chữ số");
      return;
    }
    try {
      localStorage.setItem("opusfilm-recovery-pin-set", "1");
    } catch {
      /* ignore */
    }
    setPin("");
    showToast("Đã lưu mã PIN khôi phục");
  };

  const expNow = Number(xp.exp) || 0;
  const expNext = Number(xp.nextAt) || 50;
  const expPct = Math.min(100, Math.round((expNow / Math.max(1, expNext)) * 100));

  return (
    <div data-profile-ui="social-v2" className="min-h-[100dvh] bg-[#000] text-white">
      {/* Container responsive: edge-to-edge mobile, card desktop */}
      <div className="mx-auto w-full max-w-[900px] lg:px-6 lg:py-6">
        <div className="bg-[#000] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[#1c1c1e] lg:bg-[#0a0a0a]">
          {/* ── Sticky header ── */}
          <header
            className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[#1c1c1e] bg-black/95 px-3 backdrop-blur-md sm:h-14 sm:px-5"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-full text-white active:bg-white/10"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <p className="truncate px-2 text-sm font-semibold tracking-tight sm:text-[15px]">
              {handle}
            </p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => void doSync()}
                className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-300 active:bg-white/10"
                aria-label="Đồng bộ"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#ef4444] active:bg-white/10"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* ── Hero ── */}
          <section className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
              {/* Avatar */}
              <div className="flex items-center gap-5 sm:block sm:shrink-0">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative shrink-0"
                  aria-label="Đổi ảnh đại diện"
                >
                  <UserAvatar
                    profile={{ ...profile, name: showName }}
                    size={96}
                    showBadge={false}
                  />
                  <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-black bg-[#0084ff]">
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickAvatar(f);
                    e.target.value = "";
                  }}
                />

                {/* Stats — cạnh avatar trên mobile */}
                <div className="flex flex-1 justify-around text-center sm:hidden">
                  <div>
                    <p className="text-[15px] font-bold tabular-nums">VIP {vipProg.level}</p>
                    <p className="text-[11px] text-zinc-500">{vipSubtitle(vipProg.level)}</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tabular-nums">Lv.{xp.level || 1}</p>
                    <p className="text-[11px] text-zinc-500">
                      {formatCoins(expNow)}/{formatCoins(expNext)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tabular-nums">{streak}</p>
                    <p className="text-[11px] text-zinc-500">Chuỗi ngày</p>
                  </div>
                </div>
              </div>

              {/* Identity + desktop stats */}
              <div className="min-w-0 flex-1">
                <div className="hidden sm:mb-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:text-center">
                  <div>
                    <p className="text-lg font-bold tabular-nums">VIP {vipProg.level}</p>
                    <p className="text-xs text-zinc-500">{vipSubtitle(vipProg.level)}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">Lv.{xp.level || 1}</p>
                    <p className="text-xs text-zinc-500">
                      {formatCoins(expNow)}/{formatCoins(expNext)} EXP
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tabular-nums">{streak}</p>
                    <p className="text-xs text-zinc-500">Chuỗi ngày</p>
                  </div>
                </div>

                {/* EXP bar */}
                <div className="mb-3 hidden sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#0084ff] transition-all duration-500"
                      style={{ width: `${expPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <h1 className="text-[18px] font-bold tracking-tight sm:text-xl">
                    {showName}
                  </h1>
                  {profile.verified ? <VerifiedBadge size={16} /> : null}
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">{handle}</p>
                {profile.bio ? (
                  <p className="mt-2 text-sm leading-snug text-zinc-300">{profile.bio}</p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-600">Chưa có tiểu sử</p>
                )}

                <p className="mt-2 text-xs text-zinc-500">
                  Số dư{" "}
                  <span className="tabular-nums font-semibold text-zinc-200">
                    {formatCoins(coins)} xu
                  </span>
                  {isVipActive() ? (
                    <span className="ml-2 font-medium text-[#22c55e]">· VIP đang bật</span>
                  ) : null}
                </p>

                <button
                  type="button"
                  onClick={() => void copyUid()}
                  className="mt-3 inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[#27272a] bg-[#18181b] px-3.5 py-1.5 text-xs font-medium text-zinc-200 active:scale-[0.98]"
                >
                  {profile.uid || "Chưa có UID"}
                  <Copy className="h-3.5 w-3.5 text-zinc-500" />
                </button>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-md">
                  <button
                    type="button"
                    onClick={() => setTab("security")}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1c1c1e] text-sm font-semibold active:bg-[#27272a]"
                  >
                    <Pencil className="h-4 w-4" />
                    Chỉnh sửa hồ sơ
                  </button>
                  <Link
                    href="/hop-thu"
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#1c1c1e] text-sm font-semibold active:bg-[#27272a]"
                  >
                    <Mail className="h-4 w-4" />
                    Hòm thư
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── Tabs ── */}
          <div className="sticky top-12 z-30 border-b border-[#1c1c1e] bg-black/95 backdrop-blur-md sm:top-14">
            <div className="flex">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative flex-1 py-3 text-center text-[13px] font-semibold transition-colors sm:text-sm ${
                      on ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {t.label}
                    {on ? (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-white sm:left-8 sm:right-8" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab panels ── */}
          <div className="pb-8">
            {tab === "services" ? (
              <div className="px-3 py-3 sm:px-5">
                <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#121212]">
                  {[
                    {
                      href: "/home",
                      icon: Film,
                      color: "bg-rose-500/15 text-rose-400",
                      title: "Opus Film",
                      badge: isVipActive() ? "VIP Active" : "Xem phim",
                      badgeCls: isVipActive() ? "text-[#22c55e]" : "text-zinc-400",
                      desc: "Phim bộ, phim lẻ · Lịch sử xem",
                      extra: { href: "/lich-su", label: "Lịch sử", icon: History },
                    },
                    {
                      href: "/tin-nhan",
                      icon: MessageCircle,
                      color: "bg-sky-500/15 text-[#0084ff]",
                      title: "Opus Chat",
                      badge: "Trò chuyện",
                      badgeCls: "text-[#0084ff]",
                      desc: username ? `ID: ${username}` : "Nhắn tin với bạn bè",
                    },
                    {
                      href: "/code",
                      icon: Code2,
                      color: "bg-emerald-500/15 text-emerald-400",
                      title: "Opus Code",
                      badge: "IDE",
                      badgeCls: "text-zinc-400",
                      desc: "Viết và chạy code trên trình duyệt",
                    },
                    {
                      href: "/su-kien",
                      icon: Gift,
                      color: "bg-amber-500/15 text-amber-400",
                      title: "Opus Event",
                      badge: `${formatCoins(coins)} xu`,
                      badgeCls: "text-amber-400",
                      desc: "Điểm danh, nhiệm vụ và đổi quà",
                    },
                  ].map((item, idx, arr) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.03]"
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-[15px] font-semibold">{item.title}</span>
                              <span className={`text-[11px] font-medium ${item.badgeCls}`}>
                                {item.badge}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-500">
                              {item.desc}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                        </Link>
                        {idx < arr.length - 1 ? (
                          <div className="ml-[4.25rem] border-b border-[#1c1c1e]" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tab === "frames" ? (
              <div className="px-4 py-4 sm:px-6">
                <p className="mb-3 text-xs text-zinc-500">
                  Chạm để đổi khung — xem ngay trên ảnh đại diện
                </p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                  {frameList.map((f) => {
                    const active = (profile.avatarFrame || "frame:none") === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => void selectFrame(f.id)}
                        className={`flex min-h-[44px] flex-col items-center gap-2 rounded-2xl border p-3 transition active:scale-[0.98] ${
                          active
                            ? "border-[#0084ff] bg-[#0084ff]/10"
                            : "border-[#27272a] bg-[#121212]"
                        }`}
                      >
                        <UserAvatar
                          profile={{
                            ...profile,
                            name: showName,
                            avatarFrame: f.id,
                          }}
                          size={52}
                        />
                        <span className="line-clamp-2 text-center text-[10px] leading-tight text-zinc-400">
                          {FRAME_LABELS[f.id] || f.label}
                        </span>
                        {active ? (
                          <Check className="h-3.5 w-3.5 text-[#0084ff]" />
                        ) : (
                          <span className="h-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tab === "security" ? (
              <div className="space-y-3 px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 sm:px-6">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
                    <p className="text-sm font-semibold">Thông tin cá nhân</p>
                    <label className="block space-y-1">
                      <span className="text-[11px] text-zinc-500">Tên hiển thị</span>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value.slice(0, 40))}
                        maxLength={40}
                        className="h-11 w-full rounded-xl border border-[#27272a] bg-black px-3 text-sm text-white outline-none focus:border-[#0084ff]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] text-zinc-500">Tiểu sử</span>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                        maxLength={100}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-[#27272a] bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-[#0084ff]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveProfile()}
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0084ff] text-sm font-semibold text-white active:opacity-90"
                    >
                      Lưu thay đổi
                    </button>
                    {!profile.verified ? (
                      <button
                        type="button"
                        onClick={() => setVerifyOpen(true)}
                        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#27272a] text-sm text-zinc-300"
                      >
                        <Shield className="h-4 w-4" />
                        Yêu cầu tích xanh
                      </button>
                    ) : (
                      <p className="flex items-center justify-center gap-1.5 text-xs text-[#0084ff]">
                        <VerifiedBadge size={14} />
                        Tài khoản đã xác minh
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4 space-y-3">
                    <p className="text-sm font-semibold">Mã PIN khôi phục</p>
                    <div className="relative">
                      <input
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        placeholder="6 chữ số"
                        className="h-11 w-full rounded-xl border border-[#27272a] bg-black px-3 pr-16 text-sm tracking-[0.3em] text-white outline-none focus:border-[#0084ff]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs text-zinc-400"
                      >
                        {showPin ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={savePin}
                      className="flex h-11 w-full items-center justify-center rounded-xl border border-[#27272a] text-sm font-semibold text-zinc-200 active:bg-[#1c1c1e]"
                    >
                      Lưu mã PIN
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                  <p className="mb-3 text-sm font-semibold">Thiết bị đã đăng nhập</p>
                  <div className="max-h-[280px] overflow-y-auto overscroll-contain sm:max-h-[360px]">
                    <SessionManager />
                  </div>
                  {lastSyncAt ? (
                    <p className="mt-3 text-center text-[10px] text-zinc-600">
                      Đồng bộ lần cuối: {new Date(lastSyncAt).toLocaleString("vi-VN")}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}

      <VerifyRequestModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        verified={!!profile.verified}
        onVerifiedChange={(v) => {
          updateProfile({ verified: v });
          showToast(v ? "Đã xác minh" : "Đã gửi yêu cầu");
        }}
      />
    </div>
  );
}
