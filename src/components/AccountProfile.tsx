"use client";

/**
 * Hồ sơ — flat dark Instagram/Zalo.
 * Không selector object / không summary() trong Zustand selector.
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
import { useThemeLocale } from "@/components/ThemeLocaleProvider";
import { THEME_OPTIONS, LOCALE_OPTIONS, type ThemeMode, type LocaleCode } from "@/lib/themeLocale";

type Tab = "services" | "frames" | "security";

const TAB_KEYS: { id: Tab; key: string }[] = [
  { id: "services", key: "profile.tab.services" },
  { id: "frames", key: "profile.tab.frames" },
  { id: "security", key: "profile.tab.security" },
];

const FRAME_IDS = [
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
] as const;

const FRAME_LABELS: Record<string, string> = {
  "frame:none": "Không khung",
  "frame:conic-rainbow": "Vòng cầu vồng",
  "frame:celestial-halo": "Hào quang",
  "frame:flame-ring": "Vòng lửa",
  "frame:mystic-frost": "Băng giá",
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
    const t = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(t);
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

function vipLabel(level: number) {
  if (level >= 15) return "Huyền thoại";
  if (level >= 10) return "Cao cấp";
  if (level >= 5) return "Thành viên";
  return "Tân thủ";
}

export default function AccountProfile() {
  const router = useRouter();
  const { theme, locale, setTheme, setLocale, t } = useThemeLocale();

  const username = useAccountStore((s) => s.username);
  const lastSyncAt = useAccountStore((s) => s.lastSyncAt);
  const logout = useAccountStore((s) => s.logout);
  const syncNow = useAccountStore((s) => s.syncNow);

  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setAvatar = useSettingsStore((s) => s.setAvatar);

  const coins = useEventStore((s) => (typeof s.coins === "number" ? s.coins : 0));
  const vipPoints = useEventStore((s) =>
    typeof s.vipPoints === "number" ? s.vipPoints : 0
  );

  const xpExp = useXpStore((s) => (typeof s.exp === "number" ? s.exp : 0));
  const streak = useStreakStore((s) =>
    typeof s.current === "number" ? s.current : 0
  );

  const vipProg = useMemo(() => {
    try {
      return getVipProgress(vipPoints);
    } catch {
      return { cur: { level: 1 }, next: { level: 2 }, pct: 0, earned: 0 };
    }
  }, [vipPoints]);

  const vipLevel = Number(vipProg?.cur?.level) || 1;
  const vipPct = Number(vipProg?.pct) || 0;

  // EXP đơn giản: 100 exp mỗi cấp
  const xpLevel = Math.max(1, Math.floor(xpExp / 100) + 1);
  const expNow = xpExp % 100;
  const expNext = 100;
  const expPct = Math.min(100, Math.round((expNow / expNext) * 100));

  const [tab, setTab] = useState<Tab>("services");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(profile?.name || "");
    setEditBio(profile?.bio || "");
  }, [profile?.name, profile?.bio]);

  const frames = useMemo(() => {
    const list = Array.isArray(AVATAR_FRAMES) ? AVATAR_FRAMES : [];
    const map = new Map(list.map((f) => [f.id, f]));
    return FRAME_IDS.map((id) => map.get(id)).filter(Boolean) as typeof AVATAR_FRAMES;
  }, []);

  const showToast = useCallback((t: string) => setToast(t), []);

  const showName = (profile?.name || username || "Người dùng").trim() || "Người dùng";
  const handle = username ? `@${username}` : "";
  const uid = profile?.uid ? String(profile.uid) : "";

  const avatarProfile = useMemo(
    () => ({
      name: showName,
      avatar: profile?.avatar,
      avatarPosition: profile?.avatarPosition || "50% 50%",
      verified: !!profile?.verified,
      avatarFrame: profile?.avatarFrame || profile?.frame || "frame:none",
    }),
    [showName, profile?.avatar, profile?.avatarPosition, profile?.verified, profile?.avatarFrame, profile?.frame]
  );

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2.5 * 1024 * 1024) {
      showToast("Ảnh tối đa 2.5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || "");
      if (data.startsWith("data:image")) {
        setAvatar(data);
        showToast(t("profile.avatarUpdated"));
      }
    };
    reader.readAsDataURL(file);
  };

  const copyUid = async () => {
    if (!uid) {
      showToast("Chưa có UID");
      return;
    }
    try {
      await navigator.clipboard.writeText(uid);
      showToast(t("profile.copiedUid"));
    } catch {
      showToast("Không sao chép được");
    }
  };

  const saveName = () => {
    const n = editName.trim().slice(0, 40);
    if (n.length < 1) {
      showToast("Tên không được trống");
      return;
    }
    updateProfile({ name: n });
    showToast(t("profile.savedName"));
  };

  const saveBio = () => {
    updateProfile({ bio: editBio.trim().slice(0, 100) });
    showToast(t("profile.savedBio"));
  };

  const savePin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      showToast("PIN phải đủ 6 số");
      return;
    }
    setPinBusy(true);
    try {
      const res = await fetch("/api/auth/set-recovery-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok !== false) {
        setPin("");
        showToast(t("profile.savedPin"));
      } else {
        showToast(data?.error || "Không lưu được PIN");
      }
    } catch {
      showToast("Lỗi mạng");
    } finally {
      setPinBusy(false);
    }
  };

  const doSync = async () => {
    setSyncing(true);
    try {
      await syncNow?.();
      showToast(t("profile.synced"));
    } catch {
      showToast("Đồng bộ thất bại");
    } finally {
      setSyncing(false);
    }
  };

  const selectFrame = (id: string) => {
    updateProfile({ avatarFrame: id });
    showToast(t("profile.frameChanged"));
  };

  const services = [
    { href: "/home", icon: Film, title: "Opus Film", desc: "Xem phim", badge: null as string | null },
    {
      href: "/su-kien",
      icon: Gift,
      title: "Sự kiện",
      desc: "Xu & nhiệm vụ",
      badge: `${formatCoins(coins)} {t("profile.coins")}`,
    },
    { href: "/tin-nhan", icon: MessageCircle, title: "Opus Chat", desc: "Tin nhắn", badge: null },
    { href: "/code", icon: Code2, title: "Opus Code", desc: "Lập trình", badge: null },
    { href: "/yeu-thich", icon: History, title: "Yêu thích", desc: "Phim đã lưu", badge: null },
    { href: "/cai-dat", icon: Shield, title: "Cài đặt", desc: "Tùy chọn", badge: null },
  ];

  if (!username) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-black text-zinc-400">
        Đang tải tài khoản…
      </div>
    );
  }

  return (
    <div
      data-profile-ui="social-v3"
      className="min-h-[100dvh] bg-black text-white"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto w-full max-w-lg sm:max-w-xl lg:max-w-2xl">
        <header
          className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#1a1a1a] bg-black/95 px-3 backdrop-blur-md"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top))",
            paddingBottom: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{handle || showName}</p>
          </div>
          <button
            type="button"
            onClick={() => void doSync()}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Đồng bộ"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => void logout?.()}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Identity */}
        <section className="px-4 pb-4 pt-5">
          {/* Hàng avatar + thống kê */}
          <div className="flex items-center gap-4">
            <div
              className="group/avatar relative shrink-0"
              style={{ width: 88, height: 88 }}
            >
              <UserAvatar profile={avatarProfile} size={88} showBadge />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="avatar-cam-btn absolute bottom-0 right-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[#3f3f46] bg-[#18181b] text-white shadow-md opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover/avatar:opacity-100 focus-visible:opacity-100"
                aria-label="Đổi ảnh"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="px-0.5">
                  <p className="text-base font-bold tabular-nums leading-tight sm:text-lg">
                    VIP {vipLevel}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                    {vipLabel(vipLevel)}
                  </p>
                </div>
                <div className="px-0.5">
                  <p className="text-base font-bold tabular-nums leading-tight sm:text-lg">
                    Lv.{xpLevel}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                    {expNow}/{expNext} EXP
                  </p>
                </div>
                <div className="px-0.5">
                  <p className="text-base font-bold tabular-nums leading-tight sm:text-lg">
                    {streak}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                    Chuỗi ngày
                  </p>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#0084ff] transition-all duration-500"
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tên / bio / số dư — full width, thẳng hàng */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-[17px] font-bold leading-tight tracking-tight">
                {showName}
              </h1>
              {profile?.verified ? <VerifiedBadge size={16} /> : null}
            </div>
            <p className="mt-0.5 text-sm leading-snug text-zinc-500">{handle}</p>
            {profile?.bio ? (
              <p className="mt-2 text-sm leading-snug text-zinc-300">{profile.bio}</p>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">{t("profile.noBio")}</p>
            )}
            <p className="mt-2 text-sm text-zinc-400">
              {t("profile.balance")}{" "}
              <span className="font-semibold tabular-nums text-zinc-100">
                {formatCoins(coins)} {t("profile.coins")}
              </span>
            </p>
          </div>

          {/* Nút hành động */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("security")}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1c1c1e] px-3 text-sm font-semibold min-w-[40%]"
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              Sửa hồ sơ
            </button>
            <button
              type="button"
              onClick={() => void copyUid()}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1c1c1e] px-3 text-sm font-semibold min-w-[40%]"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">UID {uid || "—"}</span>
            </button>
            {!profile?.verified ? (
              <Link
                href="/cai-dat"
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1c1c1e] px-3 text-sm font-semibold"
              >
                <Shield className="h-3.5 w-3.5 text-[#0084ff]" />
                Xác minh
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
              <span>VIP {vipLevel}</span>
              <span>{vipPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, vipPct))}%` }}
              />
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-12 z-20 border-b border-[#1a1a1a] bg-black/95 backdrop-blur-md">
          <div className="flex">
            {TAB_KEYS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
                  tab === item.id ? "text-white" : "text-zinc-500"
                }`}
              >
                {t(item.key)}
                {tab === item.id ? (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-white" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 py-4 sm:px-4">
          {tab === "services" && (
            <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#121212]">
              {services.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 active:bg-white/5 ${
                      i < services.length - 1 ? "border-b border-[#1f1f1f]" : ""
                    }`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1c1e]">
                      <Icon className="h-5 w-5 text-zinc-200" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{item.title}</span>
                      <span className="block text-xs text-zinc-500">{item.desc}</span>
                    </span>
                    {item.badge ? (
                      <span className="mr-1 text-xs font-semibold tabular-nums text-zinc-400">
                        {item.badge}
                      </span>
                    ) : null}
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </Link>
                );
              })}
            </div>
          )}

          {tab === "frames" && (
            <div>
              <div className="mb-4 flex justify-center py-2">
                <UserAvatar profile={avatarProfile} size={96} showBadge />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {frames.map((f) => {
                  const active = (profile?.avatarFrame || profile?.frame || "frame:none") === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectFrame(f.id)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                        active
                          ? "border-[#0084ff] bg-[#0084ff]/10"
                          : "border-[#27272a] bg-[#121212] active:bg-[#1a1a1a]"
                      }`}
                    >
                      <UserAvatar
                        profile={avatarProfile}
                        size={52}
                        showBadge={false}
                        frameOverride={f.id}
                      />
                      <span className="text-center text-[11px] font-medium text-zinc-400">
                        {FRAME_LABELS[f.id] || f.id.replace("frame:", "")}
                      </span>
                    </button>
                  );
                })}
              </div>
              {frames.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Chưa có khung viền
                </p>
              ) : null}
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-3 text-sm font-semibold">Thông tin</p>
                <label className="mb-1.5 block text-xs text-zinc-500">Tên hiển thị</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value.slice(0, 40))}
                  maxLength={40}
                  className="mb-2 h-11 w-full rounded-xl border border-[#27272a] bg-[#0a0a0a] px-3 text-sm outline-none focus:border-[#0084ff]"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="mb-4 h-10 w-full rounded-xl bg-[#0084ff] text-sm font-semibold"
                >
                  Lưu tên
                </button>
                <label className="mb-1.5 block text-xs text-zinc-500">Tiểu sử</label>
                <input
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="Giới thiệu ngắn"
                  className="mb-2 h-11 w-full rounded-xl border border-[#27272a] bg-[#0a0a0a] px-3 text-sm outline-none focus:border-[#0084ff]"
                />
                <button
                  type="button"
                  onClick={saveBio}
                  className="h-10 w-full rounded-xl bg-[#1c1c1e] text-sm font-semibold"
                >
                  Lưu tiểu sử
                </button>
              </div>

              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-1 text-sm font-semibold">Mã PIN khôi phục</p>
                <p className="mb-3 text-xs text-zinc-500">6 chữ số</p>
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  placeholder="••••••"
                  className="mb-2 h-11 w-full rounded-xl border border-[#27272a] bg-[#0a0a0a] px-3 text-center font-mono text-lg tracking-[0.35em] outline-none focus:border-[#0084ff]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="h-10 rounded-xl bg-[#1c1c1e] text-sm font-semibold text-zinc-300"
                  >
                    {showPin ? "Ẩn" : "Hiện"}
                  </button>
                  <button
                    type="button"
                    disabled={pinBusy}
                    onClick={() => void savePin()}
                    className="h-10 rounded-xl bg-[#0084ff] text-sm font-semibold disabled:opacity-50"
                  >
                    Lưu PIN
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-2 text-sm font-semibold">UID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-[#0a0a0a] px-3 py-2.5 font-mono text-sm tabular-nums">
                    {uid || "—"}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyUid()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1c1e]"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {lastSyncAt ? (
                  <p className="mt-2 text-[11px] text-zinc-600">
                    Đồng bộ: {new Date(lastSyncAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-2 text-sm font-semibold">Hộp thư</p>
                <Link
                  href="/hop-thu"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1c1c1e] text-sm font-semibold"
                >
                  <Mail className="h-4 w-4" />
                  Mở hộp thư
                </Link>
              </div>

              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-3 text-sm font-semibold">{t("profile.theme")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((o) => {
                    const on = theme === o.value;
                    const label = locale === "en" ? o.labelEn : o.labelVi;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          setTheme(o.value as ThemeMode);
                          showToast(label);
                        }}
                        className={`h-11 rounded-xl text-sm font-semibold transition ${
                          on
                            ? "bg-[#0084ff] text-white"
                            : "bg-[#1c1c1e] text-zinc-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <p className="mb-3 text-sm font-semibold">{t("profile.language")}</p>
                <div className="space-y-1">
                  {LOCALE_OPTIONS.map((o) => {
                    const on = locale === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          setLocale(o.value as LocaleCode);
                          showToast(o.native);
                        }}
                        className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold transition ${
                          on ? "bg-[#0084ff]/15 text-white" : "bg-[#0a0a0a] text-zinc-300"
                        }`}
                      >
                        <span>{o.native}</span>
                        {on ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0084ff] text-[10px]">
                            ✓
                          </span>
                        ) : (
                          <span className="h-5 w-5 rounded-full border border-[#3f3f46]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void logout?.()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400"
              >
                <LogOut className="h-4 w-4" />
                {t("profile.logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast ? <Toast text={toast} onDone={() => setToast("")} /> : null}
    </div>
  );
}
