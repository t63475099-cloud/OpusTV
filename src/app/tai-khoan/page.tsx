"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, LogOut, BadgeCheck, ShieldAlert, Sparkles, Lock, KeyRound, User, Camera } from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import UserAvatar from "@/components/UserAvatar";

export default function TaiKhoanPage() {
  const username = useAccountStore((s) => s.username);
  const lastSyncAt = useAccountStore((s) => s.lastSyncAt);
  const logout = useAccountStore((s) => s.logout);
  const syncNow = useAccountStore((s) => s.syncNow);
  const resetPassword = useAccountStore((s) => s.resetPassword);

  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(profile.name || "");
  const [pin, setPin] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isVerified = Boolean(profile.verified);

  const onSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: displayName.trim() });
    setMsg("Đã lưu tên hiển thị thành công.");
    setTimeout(() => setMsg(""), 3000);
  };

  const onSync = async () => {
    setLoading(true);
    setMsg("");
    const res = await syncNow();
    setLoading(false);
    if (res.ok) {
      setMsg("Đồng bộ thời gian thực thành công!");
    } else {
      setMsg(res.error || "Lỗi đồng bộ.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    const res = await resetPassword(username, pin, newPass);
    setLoading(false);
    if (res.ok) {
      setMsg("Đã đặt lại mật khẩu thành công.");
      setPin("");
      setNewPass("");
    } else {
      setMsg(res.error || "Không thể đặt lại mật khẩu.");
    }
    setTimeout(() => setMsg(""), 3000);
  };

  if (!username) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#050508]">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="relative z-10 w-full max-w-md auth-glass p-8 rounded-3xl text-center space-y-6 auth-enter">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Chưa đăng nhập</h2>
            <p className="text-sm text-zinc-400">Vui lòng đăng nhập để trải nghiệm không gian kính lỏng cá nhân.</p>
          </div>
          <Link href="/cai-dat" className="auth-btn-primary auth-btn-shimmer relative block w-full py-3.5 rounded-2xl text-white font-semibold shadow-lg overflow-hidden text-center">
            Đến trang Cài đặt & Đăng nhập
          </Link>
          <div className="pt-2">
            <Link href="/cai-dat" className="text-sm text-rose-400 hover:underline inline-flex items-center gap-1">
              ← Cài đặt
            </Link>
          </div>
        </div>
        <AuthStyles />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 overflow-hidden bg-[#050508]">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6 auth-enter">
        <Link href="/cai-dat" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Cài đặt
        </Link>

        {/* Header Profile Kính Lỏng (Đã căn chỉnh cân đối) */}
        <div className="auth-glass p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
            <div className="shrink-0">
              <UserAvatar
                profile={{ ...profile, name: displayName || username }}
                size={96}
                ring
                showBadge={isVerified}
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate">{displayName || username}</h1>
                {isVerified && (
                  <BadgeCheck className="w-6 h-6 text-[#1d9bf0] fill-[#1d9bf0] shrink-0" title="Đã xác thực" />
                )}
              </div>
              <p className="text-sm text-zinc-400 font-mono">@{username}</p>

              <div className="pt-1 flex justify-center sm:justify-start">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5" /> Tài khoản Xác thực Cấp cao
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full backdrop-blur-md">
                    <ShieldAlert className="w-3.5 h-3.5" /> Tài khoản Tiêu chuẩn
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
            <Link
              href="/cai-dat"
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium backdrop-blur-md transition-all hover:scale-[1.02]"
            >
              <Camera className="w-4 h-4 text-rose-400" /> Đổi ảnh
            </Link>
            <button
              type="button"
              onClick={onSync}
              disabled={loading}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium backdrop-blur-md transition-all hover:scale-[1.02]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Đồng bộ
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-sm font-medium backdrop-blur-md transition-all hover:scale-[1.02]"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>

        {/* Form Cài đặt Kính lỏng */}
        <div className="auth-glass p-6 sm:p-8 rounded-3xl space-y-6">
          <form onSubmit={onSaveName} className="space-y-3">
            <label className="text-xs text-zinc-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-400" /> Tên hiển thị cá nhân
            </label>
            <div className="flex gap-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị tùy thích..."
                className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-rose-500 transition-all"
                maxLength={60}
              />
              <button
                type="submit"
                className="auth-btn-shimmer relative px-6 py-3 rounded-2xl bg-white text-black font-semibold text-sm shadow-lg hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 overflow-hidden shrink-0"
              >
                Lưu
              </button>
            </div>
          </form>

          <div className="h-px bg-white/10 my-4" />

          <form onSubmit={onReset} className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 tracking-wide flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-400" /> Bảo mật & Khôi phục tài khoản
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Mã PIN khôi phục"
                className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-rose-500 transition-all"
              />
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mật khẩu mới"
                className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-rose-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !pin || !newPass}
              className="auth-btn-primary auth-btn-shimmer relative w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50 overflow-hidden"
            >
              Lưu PIN & Đổi mật khẩu
            </button>
          </form>

          {msg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center backdrop-blur-md animate-pulse">
              {msg}
            </div>
          )}

          {lastSyncAt && (
            <p className="text-[11px] text-zinc-500 text-center font-mono pt-2">
              Đồng bộ gần nhất: {new Date(lastSyncAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>

        <div className="text-center pt-2">
          <Link href="/cai-dat" className="text-sm text-rose-400 hover:underline">
            ← Trở về Cài đặt
          </Link>
        </div>
      </div>

      <AuthStyles />
    </div>
  );
}

function AuthStyles() {
  return (
    <style jsx global>{`
      .auth-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.5;
        animation: auth-float 18s ease-in-out infinite;
        pointer-events: none;
      }
      .auth-orb-1 {
        width: 420px;
        height: 420px;
        top: -8%;
        left: -10%;
        background: radial-gradient(circle, #f43f5e 0%, transparent 70%);
      }
      .auth-orb-2 {
        width: 360px;
        height: 360px;
        top: 15%;
        right: -12%;
        background: radial-gradient(circle, #a855f7 0%, transparent 70%);
        animation-delay: -6s;
      }
      .auth-orb-3 {
        width: 280px;
        height: 280px;
        bottom: 8%;
        left: 35%;
        background: radial-gradient(circle, #fb923c 0%, transparent 70%);
        animation-delay: -11s;
      }
      @keyframes auth-float {
        0%,
        100% {
          transform: translate3d(0, 0, 0);
        }
        50% {
          transform: translate3d(3%, 5%, 0);
        }
      }
      .auth-glass {
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(20px) saturate(1.4);
        -webkit-backdrop-filter: blur(20px) saturate(1.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .auth-glass:hover {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 30px rgba(244, 63, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }
      .auth-btn-primary {
        background: linear-gradient(135deg, #e11d48, #f43f5e 45%, #fb7185);
        box-shadow: 0 8px 28px rgba(244, 63, 94, 0.35);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s;
      }
      .auth-btn-primary:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .auth-btn-primary:active:not(:disabled) {
        transform: scale(0.96);
      }
      .auth-btn-shimmer::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.22) 50%, transparent 60%);
        transform: translateX(-120%);
      }
      .auth-btn-shimmer:hover:not(:disabled)::after {
        animation: auth-shimmer 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes auth-shimmer {
        to {
          transform: translateX(120%);
        }
      }
      .auth-enter {
        animation: auth-rise 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      @keyframes auth-rise {
        from {
          opacity: 0;
          transform: translate3d(0, 16px, 0);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    `}</style>
  );
}
