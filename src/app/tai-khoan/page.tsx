"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  Check,
  X,
  Loader2,
  Camera,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore, AVATAR_FRAMES } from "@/lib/settings";
import UserAvatar, { VerifiedBadge } from "@/components/UserAvatar";
import VerifyRequestModal from "@/components/VerifyRequestModal";
import { useXpStore } from "@/lib/xpStore";

type Mode = "login" | "register" | "recover";
type FieldErrors = {
  user?: string;
  displayName?: string;
  pass?: string;
  pass2?: string;
  pin?: string;
  key?: string;
  terms?: string;
};

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "bg-zinc-700" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) s++;
  if (pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw))
    s = 3;
  if (s <= 1) return { score: 1, label: "Yếu", color: "bg-red-500" };
  if (s === 2) return { score: 2, label: "Trung bình", color: "bg-amber-500" };
  return { score: 3, label: "Mạnh", color: "bg-emerald-500" };
}

function validateUsername(v: string): string | undefined {
  const t = v.trim().toLowerCase();
  if (!t) return "Vui lòng nhập tên tài khoản";
  if (t.length < 3) return "Tối thiểu 3 ký tự";
  if (!/^[a-z0-9._]+$/.test(t)) return "Chỉ dùng a–z, 0–9, . và _";
  return undefined;
}

function validatePassword(pw: string): string | undefined {
  if (!pw) return "Vui lòng nhập mật khẩu";
  if (pw.length < 8) return "Tối thiểu 8 ký tự";
  if (!/[a-z]/.test(pw)) return "Cần có chữ thường";
  if (!/[A-Z]/.test(pw)) return "Cần có chữ hoa";
  if (!/\d/.test(pw) && !/[^a-zA-Z0-9]/.test(pw)) return "Cần có số hoặc ký tự đặc biệt";
  return undefined;
}

function AuroraBg() {
  return (
    <div className="lg-orbs" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`lg-card lg-border-spin relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  error,
  rightSlot,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  autoComplete?: string;
  error?: string;
  rightSlot?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const filled = value.length > 0;
  return (
    <div className="relative mb-5">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        className={`peer w-full rounded-2xl border bg-white/[0.04] px-4 pb-2.5 pt-6 text-sm text-white outline-none transition-all duration-300 ${
          rightSlot ? "pr-12" : ""
        } ${
          error
            ? "border-red-500/50 focus:border-red-400"
            : "border-white/10 focus:border-rose-400/60 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"
        }`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-300 ${
          filled
            ? "top-2 text-[10px] font-medium text-rose-300/90"
            : "top-1/2 -translate-y-1/2 text-sm text-zinc-500 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-medium peer-focus:text-rose-300/90"
        }`}
      >
        {label}
      </label>
      {rightSlot}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
          <X className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export default function AccountPage() {
  const { username, lastSyncAt, login, register, logout, syncNow, resetPassword } =
    useAccountStore();
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const xpSummary = useXpStore((s) => s.summary);
  const profile = useSettingsStore((s) => s.profile);
  const setAvatar = useSettingsStore((s) => s.setAvatar);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [inviteKey, setInviteKey] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const k = sp.get("key");
      const m = sp.get("mode");
      if (m === "register" || m === "login" || m === "recover") setMode(m);
      if (k) setInviteKey(k.toUpperCase().slice(0, 24));
    } catch {
      /* */
    }
  }, []);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [editName, setEditName] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  useEffect(() => {
    if (username) setEditName(profile.name ?? "");
  }, [username, profile.name]);

  useEffect(() => {
    if (!username) return;
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify");
        const data = await res.json();
        if (c || !data.ok) return;
        if (typeof data.verified === "boolean") {
          updateProfile({ verified: data.verified });
        }
      } catch { /* */ }
    })();
    return () => { c = true; };
  }, [username, updateProfile]);

  /** Cắt ảnh vuông giữa + nén JPEG để đồng bộ thiết bị */
  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) {
      setErr("Ảnh tối đa 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setAvatar(dataUrl, "50% 50%");
        void useAccountStore.getState().syncNow();
        setMsg("Đã cập nhật ảnh đại diện");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const strength = useMemo(() => passwordStrength(pass), [pass]);

  useEffect(() => {
    setMounted(true);
    try {
      const r = localStorage.getItem("opusfilm-remember");
      if (r) {
        setUser(r);
        setRemember(true);
      }
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    const next: FieldErrors = {};
    if (touched.user || user) next.user = validateUsername(user);
    if (mode === "register" && (touched.displayName || displayName)) {
      if (!displayName.trim() || displayName.trim().length < 2) next.displayName = "Tối thiểu 2 ký tự";
    }
    if (touched.pass || pass) {
      next.pass =
        mode === "login" ? (pass.length < 1 ? "Vui lòng nhập mật khẩu" : undefined) : validatePassword(pass);
    }
    if ((mode === "register" || mode === "recover") && (touched.pass2 || pass2)) {
      if (!pass2) next.pass2 = "Xác nhận mật khẩu";
      else if (pass2 !== pass) next.pass2 = "Mật khẩu không khớp";
    }
    if ((mode === "register" || mode === "recover") && (touched.pin || pin)) {
      if (!/^\d{4,8}$/.test(pin.trim())) next.pin = "PIN 4–8 chữ số";
    }
    if (mode === "register" && (touched.key || inviteKey !== undefined)) {
      if (touched.key && !inviteKey.trim()) next.key = "Vui lòng nhập key";
    }
    if (mode === "register" && touched.terms && !terms) next.terms = "Cần đồng ý điều khoản";
    setErrors(next);
  }, [user, displayName, pass, pass2, pin, inviteKey, terms, mode, touched]);

  const formValid = useMemo(() => {
    if (validateUsername(user)) return false;
    if (mode === "login") return pass.length >= 1;
    if (mode === "register") {
      if (!displayName.trim() || displayName.trim().length < 2) return false;
      if (validatePassword(pass)) return false;
      if (pass !== pass2) return false;
      if (!/^\d{4,8}$/.test(pin.trim())) return false;
      if (!inviteKey.trim() || inviteKey.trim().length < 8) return false;
      if (!terms) return false;
      return true;
    }
    if (!/^\d{4,8}$/.test(pin.trim())) return false;
    if (validatePassword(pass)) return false;
    if (pass !== pass2) return false;
    return true;
  }, [user, displayName, pass, pass2, pin, inviteKey, terms, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr("");
    setMsg("");
    setTouched({});
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ user: true, displayName: true, pass: true, pass2: true, pin: true, key: true, terms: true });
    setErr("");
    setMsg("");
    if (!formValid) {
      setErr("Kiểm tra lại thông tin.");
      return;
    }
    setBusy(true);

    if (mode === "recover") {
      const res = await resetPassword(user.trim().toLowerCase(), pin.trim(), pass);
      setBusy(false);
      if (!res.ok) setErr(res.error || "Thất bại");
      else {
        setMsg("Đã đặt lại mật khẩu.");
        setPass("");
        setPass2("");
        setPin("");
        switchMode("login");
      }
      return;
    }

    if (mode === "login") {
      try {
        if (remember) localStorage.setItem("opusfilm-remember", user.trim().toLowerCase());
        else localStorage.removeItem("opusfilm-remember");
      } catch {
        /* */
      }
      const res = await login(user.trim().toLowerCase(), pass);
      setBusy(false);
      if (!res.ok) setErr(res.error || "Đăng nhập thất bại");
      else {
        setMsg("Đăng nhập thành công.");
        setPass("");
      }
      return;
    }

    const res = await register(user.trim().toLowerCase(), pass, pin.trim(), inviteKey.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || "Đăng ký thất bại");
    else {
      updateProfile({
        name: displayName.trim().slice(0, 80),
        verified: true,
      });
      void syncNow();
      setMsg("Tạo tài khoản thành công.");
      setPass("");
      setPass2("");
      setPin("");
    }
  };

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
      tabIndex={-1}
      aria-label={show ? "Ẩn" : "Hiện"}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const titles = { login: "Đăng nhập", register: "Đăng ký", recover: "Khôi phục" };

  if (username) {
    const name = profile.name != null ? profile.name.trim() : "";
    const showName = name || username;
    return (
      <div className="lg-page relative min-h-[100dvh] overflow-hidden pb-24 pt-16">
        <AuroraBg />
        <div className={`relative z-10 mx-auto max-w-lg px-4 ${mounted ? "lg-enter" : "opacity-0"}`}>
          <div className="relative pt-4">
            <Link href="/cai-dat" className="lg-btn lg-enter-delay-1 mb-5 text-xs">
              ← Cài đặt
            </Link>

            <div className="lg-enter-delay-2 flex items-end gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative group shrink-0 lg-avatar-ring"
                aria-label="Đổi ảnh đại diện"
              >
                <UserAvatar
                  profile={{ ...profile, name: showName }}
                  size={96}
                  showBadge={!!profile.verified}
                />
                <span className="absolute inset-[3px] flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-7 h-7 text-white" />
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processAvatarFile(f);
                  e.target.value = "";
                }}
              />
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white break-words tracking-tight inline-flex items-center gap-1.5 flex-wrap">
                  <span>{showName}</span>
                  {profile.verified ? <VerifiedBadge size={20} /> : null}
                </h1>
                <p className="text-sm text-zinc-400 inline-flex items-center gap-1">
                  @{username}
                  {profile.verified ? <VerifiedBadge size={14} /> : null}
                </p>
              </div>
            </div>

            <div className="lg-enter-delay-3 mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="lg-btn lg-shimmer">
                Đổi ảnh
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setErr("");
                  const r = await syncNow();
                  setBusy(false);
                  if (!r.ok) setErr(r.error || "Lỗi");
                  else setMsg("Đã đồng bộ");
                }}
                className="lg-btn lg-shimmer"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Đồng bộ
              </button>
              <button type="button" onClick={() => logout()} className="lg-btn lg-btn-danger">
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
              {!profile.verified ? (
                <button
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  className="lg-btn lg-shimmer"
                >
                  Yêu cầu xác minh
                </button>
              ) : (
                <span className="lg-btn pointer-events-none inline-flex items-center gap-1.5 text-sky-400">
                  <VerifiedBadge size={16} />
                  Đã xác minh
                </span>
              )}
            </div>
            <VerifyRequestModal
              open={verifyOpen}
              onClose={() => setVerifyOpen(false)}
              verified={!!profile.verified}
              onVerifiedChange={(v) => updateProfile({ verified: v })}
            />

            <GlassCard className="lg-enter-delay-4 mt-6 rounded-3xl p-5 space-y-5">
              {(() => {
                const xp = xpSummary();
                return (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white">
                        Lv.{xp.level} ·{" "}
                        <span style={{ color: xp.rankColor }}>{xp.rankLabel}</span>
                      </span>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {xp.exp} / {xp.nextAt} EXP
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 transition-all"
                          style={{ width: `${Math.max(4, xp.pct)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Còn <span className="text-zinc-300 font-medium">{xp.need} EXP</span> để lên{" "}
                        <span className="text-zinc-300">Lv.{xp.level + 1}</span>
                        {xp.nextRankLabel && xp.nextRankLevel ? (
                          <>
                            {" "}· Hạng tiếp:{" "}
                            <span className="text-zinc-300">
                              {xp.nextRankLabel} (Lv.{xp.nextRankLevel})
                            </span>
                          </>
                        ) : (
                          <> · Đã đạt hạng cao nhất</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {xp.ranks.map((r) => (
                        <span
                          key={r.id}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                            r.active
                              ? "font-semibold text-white border-white/30"
                              : r.reached
                              ? "text-zinc-300 border-white/15 bg-white/5"
                              : "text-zinc-600 border-white/5"
                          }`}
                          style={
                            r.active
                              ? {
                                  background: `${r.color}33`,
                                  borderColor: `${r.color}88`,
                                  color: r.color,
                                }
                              : r.reached
                              ? { color: r.color, borderColor: `${r.color}44` }
                              : undefined
                          }
                          title={`Từ Lv.${r.minLevel}`}
                        >
                          {r.label}
                          <span className="opacity-70"> ·{r.minLevel}</span>
                        </span>
                      ))}
                    </div>
                    {xp.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {xp.badges.map((b) => (
                          <span
                            key={b.id}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300"
                          >
                            {b.icon} {b.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link href={`/u/${username}`} className="text-xs text-sky-400 inline-block">
                      Xem trang cá nhân công khai →
                    </Link>
                  </div>
                );
              })()}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tên hiển thị</label>
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 64))}
                    placeholder="Nhập tên hiển thị"
                    maxLength={64}
                    className="lg-input flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const n = editName.trim().slice(0, 64);
                      updateProfile({ name: n });
                      setEditName(n);
                      void syncNow();
                      setMsg(n ? "Đã lưu" : "Đã xóa tên hiển thị");
                    }}
                    className="lg-btn lg-btn-primary shrink-0 px-5"
                  >
                    Lưu
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-2">Khung viền</p>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2 scrollbar-hide">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {AVATAR_FRAMES.map((fr) => {
                    const active = (profile.avatarFrame || "frame:none") === fr.id;
                    return (
                      <button
                        key={fr.id}
                        type="button"
                        title={fr.label}
                        onClick={() => {
                          updateProfile({ avatarFrame: fr.id });
                          void syncNow();
                        }}
                        className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                          active
                            ? "border-amber-400/60 bg-amber-500/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/5"
                        }`}
                      >
                        <span
                          className={`ab-wrap ab-frame--${fr.css || "none"}`}
                          style={{ width: 52, height: 52 }}
                        >
                          <span
                            className="ab-face rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900"
                            style={{ width: 36, height: 36 }}
                          />
                          {fr.id !== "frame:none" ? <span className="ab-ring" /> : null}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-full text-center leading-tight">
                          {fr.label}
                        </span>
                        {fr.group && fr.group !== "none" ? (
                          <span className="text-[9px] text-zinc-500">{fr.group}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <FloatingField
                  id="newpin"
                  label="Mã PIN khôi phục"
                  value={newPin}
                  onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 8))}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setPinMsg("");
                    if (!/^\d{4,8}$/.test(newPin.trim())) {
                      setPinMsg("4–8 chữ số");
                      return;
                    }
                    setBusy(true);
                    try {
                      const res = await fetch("/api/auth/set-recovery-pin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ recoveryPin: newPin.trim() }),
                      });
                      const data = await res.json();
                      setPinMsg(data.ok ? "Đã lưu PIN" : data.error || "Lỗi");
                      if (data.ok) setNewPin("");
                    } catch {
                      setPinMsg("Lỗi mạng");
                    }
                    setBusy(false);
                  }}
                  className="rounded-full bg-amber-600/90 px-4 py-2 text-sm font-medium text-white"
                >
                  Lưu PIN
                </button>
                {pinMsg && <p className="mt-2 text-xs text-emerald-400">{pinMsg}</p>}
              </div>

              {lastSyncAt && (
                <p className="text-[11px] text-zinc-600">
                  Đồng bộ gần nhất: {new Date(lastSyncAt).toLocaleString("vi-VN")}
                </p>
              )}
            </GlassCard>

            {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}
            {msg && <p className="mt-3 text-center text-sm text-emerald-400">{msg}</p>}
          </div>
        </div>
        <AuthStyles />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
      <AuroraBg />
      <div className={`relative z-10 mx-auto w-full max-w-[420px] px-4 ${mounted ? "lg-enter" : "opacity-0"}`}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-[0_8px_32px_rgba(244,63,94,0.45)] ring-1 ring-white/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{titles[mode]}</h1>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
          {(
            [
              ["login", "Đăng nhập", LogIn],
              ["register", "Đăng ký", UserPlus],
              ["recover", "Quên MK", KeyRound],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                mode === m ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <GlassCard className="rounded-3xl p-5 sm:p-7 lg-shimmer">
          <form onSubmit={onSubmit} noValidate>
            {mode === "register" && (
              <FloatingField
                id="displayName"
                label="Họ và tên"
                value={displayName}
                onChange={setDisplayName}
                onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                autoComplete="name"
                error={errors.displayName}
              />
            )}

            <FloatingField
              id="username"
              label="Tên tài khoản"
              value={user}
              onChange={setUser}
              onBlur={() => setTouched((t) => ({ ...t, user: true }))}
              autoComplete="username"
              error={errors.user}
            />

            {mode === "recover" && (
              <FloatingField
                id="pin"
                label="Mã PIN"
                value={pin}
                onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 8))}
                onBlur={() => setTouched((t) => ({ ...t, pin: true }))}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                error={errors.pin}
                rightSlot={<EyeBtn show={showPin} toggle={() => setShowPin(!showPin)} />}
              />
            )}

            <div className="mb-1">
              <FloatingField
                id="password"
                label={mode === "recover" ? "Mật khẩu mới" : "Mật khẩu"}
                value={pass}
                onChange={setPass}
                onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
                type={showPass ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={errors.pass}
                rightSlot={<EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />}
              />
              {(mode === "register" || mode === "recover") && pass && (
                <div className="-mt-3 mb-4">
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${strength.score >= i ? strength.color : "bg-zinc-700/80"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500">{strength.label}</p>
                </div>
              )}
            </div>

            {(mode === "register" || mode === "recover") && (
              <FloatingField
                id="pass2"
                label="Xác nhận mật khẩu"
                value={pass2}
                onChange={setPass2}
                onBlur={() => setTouched((t) => ({ ...t, pass2: true }))}
                type={showPass2 ? "text" : "password"}
                autoComplete="new-password"
                error={errors.pass2}
                rightSlot={<EyeBtn show={showPass2} toggle={() => setShowPass2(!showPass2)} />}
              />
            )}
            {!errors.pass2 && pass2 && pass === pass2 && (mode === "register" || mode === "recover") && (
              <p className="-mt-3 mb-4 flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" /> Khớp
              </p>
            )}

            {mode === "register" && (
              <FloatingField
                id="regpin"
                label="Mã PIN khôi phục"
                value={pin}
                onChange={(v) => setPin(v.replace(/\D/g, "").slice(0, 8))}
                onBlur={() => setTouched((t) => ({ ...t, pin: true }))}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                error={errors.pin}
                rightSlot={<EyeBtn show={showPin} toggle={() => setShowPin(!showPin)} />}
              />
            )}

            {mode === "login" && (
              <div className="mb-5 flex items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-rose-600"
                  />
                  Ghi nhớ
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("recover")}
                  className="text-sm font-medium text-rose-400 hover:text-rose-300"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

                        {mode === "register" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-zinc-400">
                    Mã kích hoạt (Key) <span className="text-rose-400">*</span>
                  </label>
                  <Link
                    href="/get-key"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Get Key
                  </Link>
                </div>
                <input
                  value={inviteKey}
                  onChange={(e) => {
                    setInviteKey(e.target.value.toUpperCase().slice(0, 24));
                    setTouched((t) => ({ ...t, key: true }));
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, key: true }))}
                  placeholder="OF-XXXX-XXXX-XXXX"
                  className={`lg-input w-full font-mono tracking-wider ${
                    errors.key ? "border-red-500/60 focus:border-red-500" : ""
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {errors.key ? (
                  <p className="text-xs text-red-400">{errors.key}</p>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Chưa có key? Bấm <strong className="text-amber-300">Get Key</strong> để nhận mã ngẫu nhiên.
                  </p>
                )}
              </div>
            )}

{mode === "register" && (
              <div className="mb-5">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      setTouched((t) => ({ ...t, terms: true }));
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-rose-600"
                  />
                  <span>Đồng ý Điều khoản & Dịch vụ</span>
                </label>
                {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !formValid}
              className="auth-btn-primary auth-btn-shimmer relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <>
                  <LogIn className="h-4 w-4" /> Đăng nhập
                </>
              ) : mode === "register" ? (
                <>
                  <UserPlus className="h-4 w-4" /> Tạo tài khoản
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" /> Đặt lại mật khẩu
                </>
              )}
            </button>
          </form>
        </GlassCard>

        {err && (
          <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {err}
          </p>
        )}
        {msg && (
          <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300">
            {msg}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link href="/cai-dat" className="text-sm text-rose-400 hover:underline">
            ← Cài đặt
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
      }
      .auth-glass-border {
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), transparent 45%, rgba(244, 63, 94, 0.2));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
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
