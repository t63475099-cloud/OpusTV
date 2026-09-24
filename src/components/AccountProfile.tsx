"use client";

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
  { id: "frames", label: "Khung" },
  { id: "security", label: "Bảo mật" },
];

const FRAME_LABELS: Record<string, string> = {
  "frame:none": "Không",
  "frame:conic-rainbow": "Cầu vồng",
  "frame:celestial-halo": "Viền sáng",
  "frame:flame-ring": "Lửa",
  "frame:mystic-frost": "Băng",
  "frame:galaxy-nebula": "Ngân hà",
  "frame:solid-gold": "Vàng",
  "frame:platinum-sweep": "Bạch kim",
  "frame:diamond-sparkle": "Kim cương",
  "frame:neon-flicker": "Xanh",
  "frame:lunar-eclipse": "Trăng",
  "frame:solar-eclipse": "Mặt trời",
};

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(t);
  }, [onDone, text]);
  return (
    <div
      className="fixed left-1/2 z-[200] -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white shadow-xl"
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {text}
    </div>
  );
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
  const vipProg = getVipProgress(useEventStore((s) => s.vipPoints || 0));
  const isVipActive = useEventStore((s) => s.isVipActive);
  const xp = useXpStore((s) => s.summary());
  const streak = useStreakStore((s) => s.current || 0);

  const [tab, setTab] = useState<Tab>("services");
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [pin, setPin] = useState("");
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showName = (profile.name || username || "").trim() || "Người dùng";
  const handle = username ? `@${username}` : "";

  const frameList = useMemo(() => {
    const ids = [
      "frame:none",
      "frame:conic-rainbow",
      "frame:celestial-halo",
      "frame:flame-ring",
      "frame:mystic-frost",
      "frame:solid-gold",
      "frame:diamond-sparkle",
      "frame:neon-flicker",
      "frame:lunar-eclipse",
    ];
    const map = new Map(AVATAR_FRAMES.map((f) => [f.id, f]));
    return ids.map((id) => map.get(id)).filter(Boolean) as typeof AVATAR_FRAMES;
  }, []);

  useEffect(() => {
    setEditName(profile.name ?? "");
    setEditBio(profile.bio ?? "");
  }, [profile.name, profile.bio]);

  useEffect(() => {
    if (!username) return;
    let c = false;
    (async () => {
      setSyncing(true);
      try {
        await useAccountStore.getState().refreshMe?.();
        await syncNow();
      } catch {
        /* */
      } finally {
        if (!c) setSyncing(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [username, syncNow]);

  const showToast = useCallback((t: string) => setToast(t), []);

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
        showToast("Đã đổi ảnh");
        await syncNow();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const copyUid = async () => {
    const uid = String(profile.uid || "");
    if (!uid) return showToast("Chưa có UID");
    try {
      await navigator.clipboard.writeText(uid);
      showToast("Đã sao chép UID");
    } catch {
      prompt("UID:", uid);
    }
  };

  const doSync = async () => {
    setSyncing(true);
    const r = await syncNow();
    setSyncing(false);
    showToast(r.ok ? "Đã đồng bộ" : "Đồng bộ lỗi");
  };

  const saveProfile = async () => {
    updateProfile({
      name: editName.trim().slice(0, 40) || profile.name,
      bio: editBio.trim().slice(0, 100),
    });
    const r = await syncNow();
    showToast(r.ok ? "Đã lưu" : "Lưu trên máy này");
  };

  const selectFrame = async (id: string) => {
    updateProfile({ avatarFrame: id });
    showToast("Đã chọn khung");
    await syncNow();
  };

  return (
    <div className="min-h-[100dvh] bg-[#000] text-white">
      {/* full-bleed đen, không orbs */}
      <div className="mx-auto w-full max-w-xl px-0 sm:px-4 sm:pt-3 sm:pb-8">
        <div className="overflow-hidden bg-[#000] sm:rounded-2xl sm:border sm:border-zinc-800 sm:bg-[#0a0a0a]">
          {/* Top */}
          <header className="flex h-12 items-center justify-between border-b border-zinc-900 px-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full active:bg-zinc-900"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold">{handle}</span>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => void doSync()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 active:bg-zinc-900"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-zinc-900"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Hero — gọn 1 khối */}
          <section className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative shrink-0"
              >
                <UserAvatar profile={{ ...profile, name: showName }} size={78} />
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-[#0084ff]">
                  <Camera className="h-3 w-3 text-white" />
                </span>
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
              <div className="flex flex-1 justify-around text-center">
                <div>
                  <p className="text-[15px] font-bold">VIP {vipProg.level}</p>
                  <p className="text-[10px] text-zinc-500">Cấp VIP</p>
                </div>
                <div>
                  <p className="text-[15px] font-bold">Lv.{xp.level || 1}</p>
                  <p className="text-[10px] text-zinc-500">
                    {formatCoins(xp.exp || 0)} EXP
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-bold">{streak}</p>
                  <p className="text-[10px] text-zinc-500">Chuỗi</p>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1">
                <h1 className="text-[16px] font-bold">{showName}</h1>
                {profile.verified ? <VerifiedBadge size={15} /> : null}
              </div>
              {profile.bio ? (
                <p className="mt-0.5 text-sm text-zinc-300 line-clamp-2">{profile.bio}</p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-500">
                <span className="tabular-nums font-medium text-zinc-300">
                  {formatCoins(coins)}
                </span>{" "}
                xu
                {isVipActive() ? (
                  <span className="ml-2 text-emerald-500">VIP</span>
                ) : null}
              </p>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void copyUid()}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-200"
              >
                {profile.uid || "UID"}
                <Copy className="h-3 w-3 text-zinc-500" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTab("security")}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 text-[13px] font-semibold"
              >
                <Pencil className="h-3.5 w-3.5" />
                Sửa hồ sơ
              </button>
              <Link
                href="/hop-thu"
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 text-[13px] font-semibold"
              >
                <Mail className="h-3.5 w-3.5" />
                Hòm thư
              </Link>
            </div>
          </section>

          {/* Tabs */}
          <div className="flex border-b border-zinc-900">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex-1 py-2.5 text-center text-[13px] font-semibold ${
                  tab === t.id ? "text-white" : "text-zinc-500"
                }`}
              >
                {t.label}
                {tab === t.id ? (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-white" />
                ) : null}
              </button>
            ))}
          </div>

          {/* Content — chiều cao giới hạn, không kéo dài vô tận */}
          <div className="max-h-[min(52vh,420px)] overflow-y-auto overscroll-contain pb-6">
            {tab === "services" ? (
              <div className="divide-y divide-zinc-900">
                {[
                  {
                    href: "/home",
                    icon: Film,
                    title: "Opus Film",
                    meta: isVipActive() ? "VIP" : "Xem phim",
                  },
                  {
                    href: "/tin-nhan",
                    icon: MessageCircle,
                    title: "Opus Chat",
                    meta: "Tin nhắn",
                  },
                  {
                    href: "/code",
                    icon: Code2,
                    title: "Opus Code",
                    meta: "Code",
                  },
                  {
                    href: "/su-kien",
                    icon: Gift,
                    title: "Opus Event",
                    meta: `${formatCoins(coins)} xu`,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 active:bg-zinc-950"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{item.title}</span>
                      <span className="text-xs text-zinc-500">{item.meta}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {tab === "frames" ? (
              <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
                {frameList.map((f) => {
                  const active = (profile.avatarFrame || "frame:none") === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => void selectFrame(f.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 ${
                        active
                          ? "border-[#0084ff] bg-[#0084ff]/10"
                          : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <UserAvatar
                        profile={{ ...profile, name: showName, avatarFrame: f.id }}
                        size={48}
                      />
                      <span className="text-[10px] text-zinc-400">
                        {FRAME_LABELS[f.id] || f.label}
                      </span>
                      {active ? <Check className="h-3 w-3 text-[#0084ff]" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {tab === "security" ? (
              <div className="space-y-3 p-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 40))}
                    placeholder="Tên hiển thị"
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-black px-3 text-sm outline-none focus:border-[#0084ff]"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                    placeholder="Tiểu sử"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm outline-none focus:border-[#0084ff]"
                  />
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    className="h-9 w-full rounded-lg bg-[#0084ff] text-sm font-semibold"
                  >
                    Lưu
                  </button>
                  {!profile.verified ? (
                    <button
                      type="button"
                      onClick={() => setVerifyOpen(true)}
                      className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-zinc-800 text-sm text-zinc-300"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Yêu cầu tích xanh
                    </button>
                  ) : null}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  <p className="text-xs text-zinc-500">PIN khôi phục (6 số)</p>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="••••••"
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-black px-3 text-sm tracking-widest outline-none focus:border-[#0084ff]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!/^\d{6}$/.test(pin)) return showToast("Cần đúng 6 số");
                      setPin("");
                      showToast("Đã lưu PIN");
                    }}
                    className="h-9 w-full rounded-lg border border-zinc-800 text-sm font-medium"
                  >
                    Lưu PIN
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="mb-2 text-xs font-medium text-zinc-400">Thiết bị</p>
                  <div className="max-h-40 overflow-y-auto">
                    <SessionManager />
                  </div>
                </div>

                {lastSyncAt ? (
                  <p className="text-center text-[10px] text-zinc-600">
                    Đồng bộ: {new Date(lastSyncAt).toLocaleString("vi-VN")}
                  </p>
                ) : null}
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
