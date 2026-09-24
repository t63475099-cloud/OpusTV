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
import {
  useSettingsStore,
  AVATAR_FRAMES,
  getAvatarFrame,
} from "@/lib/settings";
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

/** Tên khung thân thiện, không dùng từ kỹ thuật */
const FRAME_LABELS: Record<string, string> = {
  "frame:none": "Không dùng",
  "frame:conic-rainbow": "Vòng cầu vồng",
  "frame:celestial-halo": "Viền sáng",
  "frame:flame-ring": "Viền lửa",
  "frame:mystic-frost": "Viền băng",
  "frame:galaxy-nebula": "Dải ngân hà",
  "frame:solid-gold": "Vàng",
  "frame:platinum-sweep": "Bạch kim",
  "frame:diamond-sparkle": "Kim cương",
  "frame:neon-flicker": "Viền xanh",
  "frame:emp-pulse": "Viền điện",
  "frame:lunar-eclipse": "Trăng",
  "frame:solar-eclipse": "Mặt trời",
};

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(t);
  }, [onDone, text]);
  return (
    <div
      className="fixed left-1/2 z-[200] -translate-x-1/2 rounded-full bg-[#1c1c1e] px-4 py-2.5 text-sm font-medium text-white shadow-lg border border-[#27272a]"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
      role="status"
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
  const vipPoints = useEventStore((s) => s.vipPoints || 0);
  const vipProg = getVipProgress(vipPoints);
  const isVipActive = useEventStore((s) => s.isVipActive);
  const xp = useXpStore((s) => s.summary());
  const streak = useStreakStore((s) => s.current || 0);

  const [tab, setTab] = useState<Tab>("services");
  const [editOpen, setEditOpen] = useState(false);
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
    const preferred = [
      "frame:none",
      "frame:conic-rainbow",
      "frame:celestial-halo",
      "frame:flame-ring",
      "frame:mystic-frost",
      "frame:galaxy-nebula",
      "frame:solid-gold",
      "frame:platinum-sweep",
      "frame:diamond-sparkle",
      "frame:neon-flicker",
      "frame:lunar-eclipse",
      "frame:solar-eclipse",
    ];
    const map = new Map(AVATAR_FRAMES.map((f) => [f.id, f]));
    const list = preferred.map((id) => map.get(id)).filter(Boolean) as typeof AVATAR_FRAMES;
    // thêm vài khung còn lại nếu thiếu
    for (const f of AVATAR_FRAMES) {
      if (list.length >= 14) break;
      if (!list.find((x) => x.id === f.id)) list.push(f);
    }
    return list;
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
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        setAvatar(canvas.toDataURL("image/jpeg", 0.72), "50% 50%");
        showToast("Đã cập nhật ảnh đại diện");
        await syncNow();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const copyUid = async () => {
    const uid = String(profile.uid || "");
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
    showToast(r.ok ? "Đã đồng bộ" : "Đồng bộ chưa thành công");
  };

  const saveProfile = async () => {
    updateProfile({
      name: editName.trim().slice(0, 40) || profile.name,
      bio: editBio.trim().slice(0, 100),
    });
    setEditOpen(false);
    const r = await syncNow();
    showToast(r.ok ? "Đã lưu hồ sơ" : "Lưu trên máy này");
  };

  const selectFrame = async (id: string) => {
    updateProfile({ avatarFrame: id });
    showToast("Đã đổi khung ảnh");
    await syncNow();
  };

  const savePin = () => {
    if (!/^\d{6}$/.test(pin)) {
      showToast("PIN phải gồm 6 chữ số");
      return;
    }
    try {
      localStorage.setItem("opusfilm-recovery-pin-hint", "1");
    } catch {
      /* */
    }
    setPin("");
    showToast("Đã lưu mã PIN");
  };

  const vipTitle =
    vipProg.level >= 15
      ? "Huyền thoại"
      : vipProg.level >= 10
        ? "Cao cấp"
        : vipProg.level >= 5
          ? "Thành viên"
          : "Tân thủ";

  return (
    <div className="min-h-[100dvh] bg-black text-white pb-28">
      <div className="mx-auto w-full max-w-[480px] border-x border-transparent sm:border-[#18181b]">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[#1c1c1e] bg-black/90 px-3 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/10"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-semibold tracking-tight">{handle}</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => void doSync()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 active:bg-white/10"
              aria-label="Đồng bộ"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#ef4444] active:bg-white/10"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="px-4 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative shrink-0"
              aria-label="Đổi ảnh đại diện"
            >
              <UserAvatar
                profile={{ ...profile, name: showName }}
                size={92}
                showBadge={false}
              />
              <span className="absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-[#0084ff]">
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
                if (f) onAvatar(f);
                e.target.value = "";
              }}
            />

            {/* Stats */}
            <div className="flex flex-1 justify-around pt-2 text-center">
              <div>
                <p className="text-base font-bold tabular-nums">VIP {vipProg.level}</p>
                <p className="text-[11px] text-zinc-500">{vipTitle}</p>
              </div>
              <div>
                <p className="text-base font-bold tabular-nums">Lv. {xp.level || 1}</p>
                <p className="text-[11px] text-zinc-500">
                  {formatCoins(xp.exp || 0)}/{formatCoins(xp.nextAt || 50)} EXP
                </p>
              </div>
              <div>
                <p className="text-base font-bold tabular-nums">{streak || 0}</p>
                <p className="text-[11px] text-zinc-500">Chuỗi ngày</p>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[17px] font-bold tracking-tight">{showName}</h1>
              {profile.verified ? <VerifiedBadge size={16} /> : null}
            </div>
            {profile.bio ? (
              <p className="mt-1 text-sm leading-snug text-zinc-300">{profile.bio}</p>
            ) : (
              <p className="mt-1 text-sm text-zinc-600">Chưa có tiểu sử</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              Số dư:{" "}
              <span className="tabular-nums font-semibold text-zinc-300">
                {formatCoins(coins)} xu
              </span>
              {isVipActive() ? (
                <span className="ml-2 text-[#22c55e]">· VIP đang bật</span>
              ) : null}
            </p>
          </div>

          {/* UID pill */}
          <button
            type="button"
            onClick={() => void copyUid()}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#18181b] px-3.5 py-1.5 text-xs font-medium text-zinc-200 active:scale-[0.98]"
          >
            {profile.uid || "—"}
            <Copy className="h-3.5 w-3.5 text-zinc-500" />
          </button>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditOpen(true);
                setTab("security");
              }}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1c1c1e] text-sm font-semibold active:bg-[#27272a]"
            >
              <Pencil className="h-3.5 w-3.5" />
              Chỉnh sửa hồ sơ
            </button>
            <Link
              href="/hop-thu"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1c1c1e] text-sm font-semibold active:bg-[#27272a]"
            >
              <Mail className="h-3.5 w-3.5" />
              Hòm thư
            </Link>
          </div>
        </section>

        {/* Segmented tabs */}
        <div className="sticky top-12 z-30 border-b border-[#1c1c1e] bg-black/95 px-2 backdrop-blur-md">
          <div className="flex">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative flex-1 py-3 text-center text-[13px] font-semibold transition-colors ${
                    on ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {t.label}
                  {on ? (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab: Services */}
        {tab === "services" ? (
          <div className="divide-y divide-[#1c1c1e] px-2 py-1">
            {[
              {
                href: "/home",
                icon: Film,
                title: "Opus Film",
                status: isVipActive() ? "VIP" : "Xem phim",
                statusColor: isVipActive() ? "text-[#22c55e]" : "text-zinc-400",
                desc: "Phim bộ, phim lẻ và nhiều thể loại",
              },
              {
                href: "/tin-nhan",
                icon: MessageCircle,
                title: "Opus Chat",
                status: "Trò chuyện",
                statusColor: "text-[#0084ff]",
                desc: username ? `ID: ${username}` : "Nhắn tin với bạn bè",
              },
              {
                href: "/code",
                icon: Code2,
                title: "Opus Code",
                status: "Lập trình",
                statusColor: "text-zinc-400",
                desc: "Viết và chạy code trên trình duyệt",
              },
              {
                href: "/su-kien",
                icon: Gift,
                title: "Opus Event",
                status: `${formatCoins(coins)} xu`,
                statusColor: "text-amber-400",
                desc: "Điểm danh, nhiệm vụ và đổi quà",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-3.5 active:bg-[#121212]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18181b]">
                    <Icon className="h-5 w-5 text-zinc-200" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span className={`text-[11px] font-medium ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {item.desc}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </Link>
              );
            })}
          </div>
        ) : null}

        {/* Tab: Frames */}
        {tab === "frames" ? (
          <div className="px-4 py-4">
            <p className="mb-3 text-xs text-zinc-500">Chọn khung cho ảnh đại diện</p>
            <div className="flex flex-wrap gap-3">
              {frameList.map((f) => {
                const active = (profile.avatarFrame || "frame:none") === f.id;
                const label = FRAME_LABELS[f.id] || f.label;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => void selectFrame(f.id)}
                    className={`flex w-[30%] min-w-[88px] flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                      active
                        ? "border-[#0084ff] bg-[#0084ff]/10"
                        : "border-[#27272a] bg-[#18181b]"
                    }`}
                  >
                    <UserAvatar
                      profile={{
                        ...profile,
                        name: showName,
                        avatarFrame: f.id,
                      }}
                      size={56}
                    />
                    <span className="line-clamp-2 text-center text-[10px] leading-tight text-zinc-300">
                      {label}
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

        {/* Tab: Security */}
        {tab === "security" ? (
          <div className="space-y-4 px-4 py-4">
            {(editOpen || true) && (
              <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-4 space-y-3">
                <p className="text-sm font-semibold">Thông tin cá nhân</p>
                <label className="block space-y-1">
                  <span className="text-[11px] text-zinc-500">Tên hiển thị</span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 40))}
                    maxLength={40}
                    className="h-10 w-full rounded-xl border border-[#27272a] bg-black px-3 text-sm text-white outline-none focus:border-[#0084ff]"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-zinc-500">Tiểu sử</span>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 100))}
                    maxLength={100}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[#27272a] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#0084ff]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  className="h-10 w-full rounded-xl bg-[#0084ff] text-sm font-semibold text-white active:opacity-90"
                >
                  Lưu
                </button>
                {!profile.verified ? (
                  <button
                    type="button"
                    onClick={() => setVerifyOpen(true)}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#27272a] text-sm text-zinc-300"
                  >
                    <Shield className="h-4 w-4" />
                    Yêu cầu tích xanh
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-1 text-xs text-[#0084ff]">
                    <VerifiedBadge size={14} /> Đã xác minh
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-4 space-y-3">
              <p className="text-sm font-semibold">Mã PIN khôi phục</p>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="6 chữ số"
                className="h-10 w-full rounded-xl border border-[#27272a] bg-black px-3 text-sm tracking-widest text-white outline-none focus:border-[#0084ff]"
              />
              <button
                type="button"
                onClick={savePin}
                className="h-10 w-full rounded-xl border border-[#27272a] text-sm font-semibold text-zinc-200 active:bg-[#1c1c1e]"
              >
                Lưu mã PIN
              </button>
            </div>

            <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-4">
              <p className="mb-3 text-sm font-semibold">Thiết bị đã đăng nhập</p>
              <SessionManager />
            </div>

            {lastSyncAt ? (
              <p className="text-center text-[11px] text-zinc-600">
                Đồng bộ lần cuối: {new Date(lastSyncAt).toLocaleString("vi-VN")}
              </p>
            ) : null}
          </div>
        ) : null}
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
