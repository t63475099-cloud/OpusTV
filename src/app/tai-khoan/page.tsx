"use client";
import { useEventStore, getVipProgress, VIP_LEVELS } from "@/lib/eventCoins";


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
  Mail,
  Copy,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore, AVATAR_FRAMES } from "@/lib/settings";
import UserAvatar from "@/components/UserAvatar";
import ProfileMotionCanvas from "@/components/ProfileMotionCanvas";
import VerifyRequestModal from "@/components/VerifyRequestModal";
import SessionManager from "@/components/SessionManager";
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

function AuthCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; a: number; hue: number }[] = [];
    const resize = () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        a: 0.15 + Math.random() * 0.35,
        hue: [340, 280, 210, 25][i % 4],
      });
    }
    const orbs = [
      { x: 0.2, y: 0.25, r: 180, hue: 340 },
      { x: 0.8, y: 0.3, r: 160, hue: 280 },
      { x: 0.5, y: 0.75, r: 140, hue: 25 },
    ];
    let t = 0;
    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);
      for (const o of orbs) {
        const ox = o.x * w + Math.sin(t + o.hue) * 40;
        const oy = o.y * h + Math.cos(t * 0.8 + o.hue) * 30;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, `hsla(${o.hue}, 90%, 55%, 0.22)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl ${className}`}
      style={{
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        backdropFilter: "blur(24px) saturate(1.4)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(244,63,94,0.15), transparent 50%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(168,85,247,0.12), transparent 50%)",
        }}
      />
      <div className="relative z-[1]">{children}</div>
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
    <div className="relative mb-4">
      <div className="relative group/field">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder=" "
          className={`peer block w-full h-[54px] rounded-2xl border bg-white/[0.06] backdrop-blur-md pl-4 ${
            rightSlot ? "pr-11" : "pr-4"
          } pt-[20px] pb-2 text-[15px] leading-none text-white outline-none transition-[border-color,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            error
              ? "border-red-500/50 focus:border-red-400"
              : "border-white/12 focus:border-rose-400/70 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(244,63,94,0.2)]"
          }`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 z-[1] origin-left will-change-transform ${
            filled
              ? "top-[8px] translate-y-0 scale-[0.72] text-rose-300/95 font-medium"
              : "top-1/2 -translate-y-1/2 scale-100 text-zinc-500 peer-focus:top-[8px] peer-focus:translate-y-0 peer-focus:scale-[0.72] peer-focus:text-rose-300/95 peer-focus:font-medium"
          }`}
          style={{
            transition:
              "top 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s ease, font-weight 0.5s ease",
            fontSize: "14px",
            lineHeight: 1,
          }}
        >
          {label}
        </label>
        {rightSlot}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs leading-snug text-red-400 animate-[auth-rise_0.35s_ease]">
          <X className="h-3 w-3 shrink-0" />
          <span>{error}</span>
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
  const vipPoints = useEventStore((s) => s.vipPoints || 0);
  const vipExpiresAt = useEventStore((s) => s.vipExpiresAt);
  const equippedBadge = useEventStore((s) => s.equippedBadge);
  const inventory = useEventStore((s) => s.inventory);
  const equipItem = useEventStore((s) => s.equipItem);
  const isVipActive = useEventStore((s) => s.isVipActive);
  const vipProg = getVipProgress(vipPoints);
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
    try {
      const u = useAccountStore.getState().username;
      if (u) useEventStore.getState().addMissionProgress("login");
    } catch {}
  }, []);
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
  const [editBio, setEditBio] = useState("");
  const [avatarTab, setAvatarTab] = useState<"frame" | "badge">("frame");
  const [uidCopied, setUidCopied] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  useEffect(() => {
    if (username) {
      setEditName(profile.name ?? "");
      setEditBio(profile.bio ?? "");
    }
  }, [username]);

  // Đồng bộ UID từ server vào hồ sơ (mỗi tài khoản một UID)
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled || !data?.ok || !data.user) return;
        const uid = String(data.user.uid || "").trim();
        if (uid) {
          useSettingsStore.getState().updateProfile({
            uid,
            verified: !!data.user.verified,
          });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

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
        name: displayName.slice(0, 80),
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
      className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/10 hover:text-white transition"
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
      <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto pb-[max(7rem,env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
        <ProfileMotionCanvas />
        <div className={`relative z-10 mx-auto max-w-md px-3 sm:px-4 ${mounted ? "lg-enter" : "opacity-0"}`}>
          <div className="pt-3 pb-2">
            <Link
              href="/cai-dat"
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition px-1"
            >
              ← Cài đặt
            </Link>
          </div>

          {/* Card profile Zalo */}
          <div className="zalo-glass rounded-3xl overflow-hidden lg-enter-delay-1">
            <div className="zalo-cover" />
            <div className="relative px-4 pb-4 -mt-12">
              <div className="flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative group"
                  aria-label="Đổi ảnh đại diện"
                >
                  <UserAvatar
                    profile={{ ...profile, name: showName }}
                    size={108}
                    showBadge={!!profile.verified}
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition">
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
                <h1 className="mt-3 text-xl font-bold text-white tracking-tight break-words max-w-full">
                  {showName}
                </h1>
                <p className="text-sm text-zinc-400">@{username}</p>
                {profile.uid ? (
                  <div className="mt-3 w-full max-w-xs rounded-2xl bg-black/30 border border-white/10 px-3 py-2.5 text-left">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">UID kết bạn</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono text-rose-300 tracking-wider truncate">
                        {profile.uid}
                      </code>
                      <button
                        type="button"
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-semibold"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(String(profile.uid));
                            setUidCopied(true);
                            setTimeout(() => setUidCopied(false), 1500);
                          } catch {}
                        }}
                      >
                        {uidCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {uidCopied ? "Đã chép" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1.5">Gửi UID này để người khác kết bạn trên Tin nhắn</p>
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-zinc-600">Đang lấy UID… bấm Đồng bộ nếu chưa hiện</p>
                )}
                {profile.bio ? (
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-3 max-w-sm">
                    {profile.bio}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex justify-center gap-2">
                <Link
                  href="/hop-thu"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full zalo-glass-soft text-xs font-medium text-white hover:bg-white/10 transition"
                >
                  <Mail className="w-4 h-4 text-sky-400" />
                  Hòm thư
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium zalo-glass-soft text-white hover:bg-white/10 transition"
                >
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
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium zalo-glass-soft text-white hover:bg-white/10 transition inline-flex items-center gap-1.5"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Đồng bộ
                </button>
                {!profile.verified ? (
                  <button
                    type="button"
                    onClick={() => setVerifyOpen(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-sky-600/80 text-white hover:bg-sky-500 transition inline-flex items-center gap-1.5"
                  >
                    Xác minh
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-sky-200 bg-sky-500/15 border border-sky-400/30">
                    <svg viewBox="0 0 24 24" width={14} height={14} className="shrink-0" aria-hidden>
                      <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
                      <path d="M10.1 15.9 7 12.8l1.4-1.4 1.7 1.7 5-5.1L16.5 9.4z" fill="#fff" />
                    </svg>
                    Đã xác minh
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium text-rose-300 hover:bg-rose-500/15 transition"
                >
                  Đăng xuất
                </button>
              </div>

              {/* VIP 15 cấp — full width, ngoài hàng nút */}
              <div className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: vipProg.cur.color }}>
                    VIP {vipProg.cur.level}/15 · {vipProg.cur.title}
                    {isVipActive() ? " · Đang active" : ""}
                  </span>
                  <span className="text-[10px] text-zinc-500 tabular-nums">
                    {vipProg.earned.toLocaleString("vi-VN")}/{vipProg.next.need.toLocaleString("vi-VN")} điểm
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${vipProg.pct}%`,
                      background: `linear-gradient(90deg, ${vipProg.cur.color}, ${vipProg.next.color})`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {vipProg.cur.level >= 15
                    ? "Đã đạt cấp tối đa"
                    : `Còn ${Math.max(0, vipProg.next.need - vipProg.earned).toLocaleString("vi-VN")} điểm VIP → ${vipProg.next.title}`}
                </p>
                {equippedBadge && (
                  <p className="text-[11px] text-amber-200/90 mt-1">Huy hiệu: {equippedBadge}</p>
                )}
              </div>
            </div>
          </div>

          <VerifyRequestModal
            open={verifyOpen}
            onClose={() => setVerifyOpen(false)}
            verified={!!profile.verified}
            onVerifiedChange={(v) => updateProfile({ verified: v })}
          />

          
          {/* Cấp bậc */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 lg-enter-delay-2 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Cấp bậc</p>
            {(() => {
              const xp = xpSummary();
              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      Lv.{xp.level} · <span style={{ color: xp.rankColor }}>{xp.rankLabel}</span>
                    </span>
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {xp.exp} / {xp.nextAt} EXP
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 transition-all"
                      style={{ width: `${Math.max(4, xp.pct)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Còn <span className="text-zinc-300">{xp.need} EXP</span> để lên Lv.{xp.level + 1}
                  </p>
                </>
              );
            })()}
          </div>

          {/* Tên hiển thị */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Tên hiển thị</p>
            <div className="flex gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 80))}
                placeholder="Nhập tên"
                maxLength={80}
                className="lg-input flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => {
                  const n = editName.slice(0, 80);
                  updateProfile({ name: n });
                  setEditName(n);
                  void syncNow();
                  setMsg(n.trim() ? "Đã lưu tên" : "Đã xóa tên");
                }}
                className="lg-btn lg-btn-primary shrink-0 px-4"
              >
                Lưu
              </button>
            </div>
          </div>

          {/* Giới thiệu */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Giới thiệu</p>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value.slice(0, 160))}
              placeholder="Viết vài dòng về bạn..."
              maxLength={160}
              rows={2}
              className="lg-input w-full resize-none"
            />
            <button
              type="button"
              onClick={() => {
                updateProfile({ bio: editBio.slice(0, 160) });
                void syncNow();
                setMsg("Đã lưu giới thiệu");
              }}
              className="lg-btn lg-btn-primary px-4"
            >
              Lưu
            </button>
          </div>

          {/* Khung viền */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Khung viền</p>
            <div className="max-h-64 overflow-y-auto rounded-xl zalo-glass-soft p-2 scrollbar-hide">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                <div className="flex gap-1 p-1 mb-3 rounded-xl bg-white/5 border border-white/10">
                  <button type="button" onClick={() => setAvatarTab("frame")} className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-500 ${avatarTab === "frame" ? "bg-white/15 text-white" : "text-zinc-400"}`}>Khung viền</button>
                  <button type="button" onClick={() => setAvatarTab("badge")} className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-500 ${avatarTab === "badge" ? "bg-white/15 text-white" : "text-zinc-400"}`}>Huy hiệu</button>
                </div>
                {avatarTab === "badge" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {(inventory || []).filter((i) => i.kind === "badge").length === 0 ? (
                      <p className="col-span-full text-xs text-zinc-500 py-4 text-center">Chưa có huy hiệu — đổi ở Sự kiện</p>
                    ) : (
                      (inventory || []).filter((i) => i.kind === "badge").map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => equipItem(b.id)}
                          className={`rounded-xl border px-2 py-2 text-left text-xs transition-all duration-500 ${
                            equippedBadge === b.meta
                              ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                          }`}
                        >
                          <span className="block font-medium truncate">{b.name}</span>
                          <span className="text-[10px] text-zinc-500">x{b.qty} · Trang bị</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {avatarTab === "frame" && AVATAR_FRAMES.map((fr) => {
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
                      className={`relative flex flex-col items-center gap-1 rounded-xl border p-1.5 transition ${
                        active
                          ? "border-sky-400/50 bg-sky-500/10"
                          : "border-white/10 bg-black/20 hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`ab-wrap ab-frame--${fr.css || "none"}`}
                        style={{ width: 48, height: 48 }}
                      >
                        <span
                          className="ab-face rounded-full bg-gradient-to-br from-zinc-600 to-zinc-900"
                          style={{ width: 34, height: 34 }}
                        />
                        {fr.id !== "frame:none" ? <span className="ab-ring" /> : null}
                      </span>
                      <span className="text-[9px] text-zinc-500 truncate max-w-full text-center leading-tight">
                        {fr.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bảo mật */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 space-y-3">
            <p className="text-xs font-medium text-zinc-400">Bảo mật</p>
            <FloatingField
              id="newpin"
              label="Recovery PIN"
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
            {pinMsg && <p className="text-xs text-emerald-400">{pinMsg}</p>}
          </div>

          {/* Quản lý phiên làm việc */}
          <div className="zalo-glass rounded-2xl p-4 mt-3">
            <SessionManager />
          </div>

          {/* Đồng bộ */}
          <div className="zalo-glass rounded-2xl p-4 mt-3 mb-2">
            {lastSyncAt ? (
              <p className="text-[11px] text-zinc-500">
                Đồng bộ gần nhất: {new Date(lastSyncAt).toLocaleString("vi-VN")}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-600">Chưa đồng bộ lần nào</p>
            )}
          </div>


            {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}
            {msg && <p className="mt-3 text-center text-sm text-emerald-400">{msg}</p>}
        </div>
        <AuthStyles />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
      <AuthCanvas />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-neutral-950/40 backdrop-blur-[2px]" aria-hidden />
      <div className={`relative z-10 mx-auto w-full max-w-[420px] px-4 ${mounted ? "auth-enter" : "opacity-0"}`}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-[0_8px_32px_rgba(244,63,94,0.45)] ring-1 ring-white/25 transition-transform duration-500 hover:scale-105">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white">{titles[mode]}</h1>
          <p className="mt-1.5 text-xs leading-none text-zinc-500">OpusFilm</p>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/12 bg-white/[0.04] p-1 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
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
              className={`flex h-10 items-center justify-center gap-1.5 rounded-xl px-1 text-xs font-semibold leading-none transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] sm:text-sm ${
                mode === m ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate leading-none">{label}</span>
            </button>
          ))}
        </div>

        <GlassCard className="auth-glass rounded-3xl p-5 sm:p-7 lg-shimmer overflow-hidden">
          <form onSubmit={onSubmit} noValidate>
            {mode === "register" && (
              <FloatingField
                id="displayName"
                label="Họ và tên / Display name"
                value={displayName}
                onChange={setDisplayName}
                onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                autoComplete="name"
                error={errors.displayName}
              />
            )}

            <FloatingField
              id="username"
              label="Username"
              value={user}
              onChange={setUser}
              onBlur={() => setTouched((t) => ({ ...t, user: true }))}
              autoComplete="username"
              error={errors.user}
            />

            {mode === "recover" && (
              <FloatingField
                id="pin"
                label="PIN"
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
                label={mode === "recover" ? "New Password" : "Password"}
                value={pass}
                onChange={setPass}
                onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
                type={showPass ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={errors.pass}
                rightSlot={<EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />}
              />
              {(mode === "register" || mode === "recover") && pass && (
                <div className="-mt-2 mb-4 px-0.5">
                  <div className="mb-1.5 flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${strength.score >= i ? strength.color : "bg-zinc-700/80"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] leading-none text-zinc-500">{strength.label}</p>
                </div>
              )}
            </div>

            {(mode === "register" || mode === "recover") && (
              <FloatingField
                id="pass2"
                label="Confirm Password"
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
              <p className="-mt-2 mb-4 flex items-center gap-1.5 pl-0.5 text-xs leading-none text-emerald-400">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>Khớp</span>
              </p>
            )}

            {mode === "register" && (
              <FloatingField
                id="regpin"
                label="Recovery PIN"
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
              <div className="mb-5 flex items-center justify-between gap-3 px-0.5">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm leading-none text-zinc-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-rose-600 align-middle"
                  />
                  <span className="leading-none">Ghi nhớ</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("recover")}
                  className="text-sm font-medium leading-none text-rose-400 hover:text-rose-300"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <label className="text-xs font-medium leading-none text-zinc-400">
                    Mã kích hoạt <span className="text-rose-400">*</span>
                  </label>
                  <Link
                    href="/get-key"
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 text-xs font-semibold leading-none text-amber-300 hover:text-amber-200 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5 shrink-0" />
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
                  className={`block w-full h-[48px] rounded-2xl border bg-white/[0.05] px-4 text-[15px] leading-none font-mono tracking-wider text-white outline-none transition-all duration-300 placeholder:text-zinc-600 ${
                    errors.key
                      ? "border-red-500/60 focus:border-red-400"
                      : "border-white/12 focus:border-rose-400/60 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {errors.key ? (
                  <p className="flex items-center gap-1.5 pl-1 text-xs leading-snug text-red-400">{errors.key}</p>
                ) : (
                  <p className="pl-0.5 text-[11px] leading-snug text-zinc-500">
                    Chưa có key? Bấm <strong className="text-amber-300">Get Key</strong> để nhận mã.
                  </p>
                )}
              </div>
            )}

{mode === "register" && (
              <div className="mb-5 px-0.5">
                <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-zinc-300">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => {
                      setTerms(e.target.checked);
                      setTouched((t) => ({ ...t, terms: true }));
                    }}
                    className="mt-[3px] h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-rose-600"
                  />
                  <span className="leading-snug">
                    Đồng ý{" "}
                    <Link href="/dieu-khoan" className="text-sky-400 hover:underline" target="_blank">
                      Điều khoản
                    </Link>{" "}
                    &{" "}
                    <Link href="/dieu-khoan#bao-mat" className="text-sky-400 hover:underline" target="_blank">
                      Chính sách
                    </Link>
                  </span>
                </label>
                {errors.terms && <p className="mt-1.5 pl-6 text-xs leading-snug text-red-400">{errors.terms}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !formValid}
              className="auth-btn-primary auth-btn-shimmer relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold leading-none text-white disabled:opacity-40"
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
        opacity: 0.55;
        animation: auth-float 18s ease-in-out infinite;
        will-change: transform;
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
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50% { transform: translate3d(3%, 5%, 0) scale(1.05); }
      }
      .auth-glass {
        background: rgba(12, 12, 16, 0.55) !important;
        backdrop-filter: blur(24px) saturate(1.5) !important;
        -webkit-backdrop-filter: blur(24px) saturate(1.5) !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        box-shadow:
          0 24px 64px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.03) !important;
        transition: box-shadow 0.5s ease, border-color 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      .auth-btn-primary {
        background: linear-gradient(135deg, #e11d48, #f43f5e 45%, #fb7185);
        box-shadow: 0 8px 28px rgba(244, 63, 94, 0.35);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), filter 0.25s, box-shadow 0.25s;
      }
      .auth-btn-primary:hover:not(:disabled) {
        filter: brightness(1.08);
        box-shadow: 0 12px 36px rgba(244, 63, 94, 0.45);
      }
      .auth-btn-primary:active:not(:disabled) {
        transform: scale(0.96);
      }
      .auth-btn-shimmer {
        position: relative;
        overflow: hidden;
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
        to { transform: translateX(120%); }
      }
      .auth-enter {
        animation: auth-rise 0.55s cubic-bezier(0.4, 0, 0.2, 1) both;
      }
      @keyframes auth-rise {
        from { opacity: 0; transform: translate3d(0, 18px, 0); }
        to { opacity: 1; transform: none; }
      }
      .opus-search-shell:focus-within {
        border-color: rgba(255, 255, 255, 0.28) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(244, 63, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
      }
    `}</style>
  );
}
