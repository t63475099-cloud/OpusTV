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
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";

type Mode = "login" | "register" | "recover";
type FieldErrors = {
  user?: string;
  displayName?: string;
  pass?: string;
  pass2?: string;
  pin?: string;
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#05050a]" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,10,0.7)_70%)]" />
    </div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateZ(0)`;
    };
    const onLeave = () => {
      el.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`auth-glass relative will-change-transform transition-transform duration-200 ease-out ${className}`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="auth-glass-border pointer-events-none absolute inset-0 rounded-[inherit]" />
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
    <div className="auth-field group relative mb-5">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder=" "
        className={`peer auth-input w-full rounded-2xl border bg-white/[0.04] px-4 pb-2.5 pt-6 text-sm text-white outline-none transition-all duration-300 ${
          rightSlot ? "pr-12" : ""
        } ${
          error
            ? "border-red-500/50 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
            : "border-white/10 focus:border-rose-400/60 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18),0_0_24px_rgba(244,63,94,0.12)]"
        }`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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

  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [mounted, setMounted] = useState(false);

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
      if (!displayName.trim()) next.displayName = "Vui lòng nhập tên hiển thị";
      else if (displayName.trim().length < 2) next.displayName = "Tối thiểu 2 ký tự";
    }
    if (touched.pass || pass) {
      next.pass =
        mode === "login"
          ? pass.length < 1
            ? "Vui lòng nhập mật khẩu"
            : undefined
          : validatePassword(pass);
    }
    if ((mode === "register" || mode === "recover") && (touched.pass2 || pass2)) {
      if (!pass2) next.pass2 = "Vui lòng xác nhận mật khẩu";
      else if (pass2 !== pass) next.pass2 = "Mật khẩu không khớp";
    }
    if ((mode === "register" || mode === "recover") && (touched.pin || pin)) {
      if (!/^\d{4,8}$/.test(pin.trim())) next.pin = "4–8 chữ số";
    }
    if (mode === "register" && touched.terms && !terms) next.terms = "Cần đồng ý điều khoản";
    setErrors(next);
  }, [user, displayName, pass, pass2, pin, terms, mode, touched]);

  const formValid = useMemo(() => {
    if (validateUsername(user)) return false;
    if (mode === "login") return pass.length >= 1;
    if (mode === "register") {
      if (!displayName.trim() || displayName.trim().length < 2) return false;
      if (validatePassword(pass)) return false;
      if (pass !== pass2) return false;
      if (!/^\d{4,8}$/.test(pin.trim())) return false;
      if (!terms) return false;
      return true;
    }
    if (!/^\d{4,8}$/.test(pin.trim())) return false;
    if (validatePassword(pass)) return false;
    if (pass !== pass2) return false;
    return true;
  }, [user, displayName, pass, pass2, pin, terms, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr("");
    setMsg("");
    setTouched({});
    setShowPass(false);
    setShowPass2(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ user: true, displayName: true, pass: true, pass2: true, pin: true, terms: true });
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
        setMsg(res.message || "Đã đặt lại mật khẩu.");
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
    const res = await register(user.trim().toLowerCase(), pass, pin.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || "Đăng ký thất bại");
    else {
      updateProfile({ name: displayName.trim().slice(0, 40) });
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
      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
      tabIndex={-1}
      aria-label={show ? "Ẩn" : "Hiện"}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const titles = {
    login: "Đăng nhập",
    register: "Đăng ký",
    recover: "Khôi phục",
  };

  if (username) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
        <AuroraBg />
        <div
          className={`relative z-10 mx-auto max-w-md ${mounted ? "auth-enter" : "opacity-0"}`}
        >
          <GlassCard className="rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-600/40">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{username}</h1>
                <p className="text-xs text-zinc-400">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleString("vi-VN") : "Đã đăng nhập"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await syncNow();
                  setBusy(false);
                  if (!r.ok) setErr(r.error || "Lỗi");
                  else setMsg("Đã đồng bộ.");
                }}
                className="auth-btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Đồng bộ
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-white/15 active:scale-95"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <FloatingField
                id="newpin"
                label="Mã khôi phục"
                value={newPin}
                onChange={(v) => setNewPin(v.replace(/\D/g, "").slice(0, 8))}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                rightSlot={<EyeBtn show={showPin} toggle={() => setShowPin(!showPin)} />}
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
                    setPinMsg(data.ok ? "Đã lưu." : data.error || "Lỗi");
                    if (data.ok) setNewPin("");
                  } catch {
                    setPinMsg("Lỗi mạng");
                  }
                  setBusy(false);
                }}
                className="rounded-full bg-amber-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 active:scale-95"
              >
                Lưu mã
              </button>
              {pinMsg && <p className="mt-2 text-xs text-emerald-400">{pinMsg}</p>}
            </div>
          </GlassCard>
          {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}
          {msg && <p className="mt-3 text-center text-sm text-emerald-400">{msg}</p>}
          <div className="mt-6 text-center">
            <Link href="/cai-dat" className="text-sm text-rose-400 hover:underline">
              ← Cài đặt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
      <AuroraBg />

      <div
        className={`relative z-10 mx-auto w-full max-w-[420px] ${mounted ? "auth-enter" : "opacity-0"}`}
      >
        <div className="mb-6 text-center auth-stagger-1">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-[0_8px_32px_rgba(244,63,94,0.45)] ring-1 ring-white/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{titles[mode]}</h1>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1 backdrop-blur-xl auth-stagger-2">
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
                mode === m
                  ? "bg-white text-black shadow-lg"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <GlassCard className="rounded-3xl p-5 sm:p-7 auth-stagger-3">
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
                label="Mã khôi phục"
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
                <div className="-mt-3 mb-4 px-0.5">
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          strength.score >= i ? strength.color : "bg-zinc-700/80"
                        }`}
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
                label="Mã khôi phục"
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
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-rose-600 focus:ring-rose-500/40"
                  />
                  Ghi nhớ
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("recover")}
                  className="text-sm font-medium text-rose-400 transition hover:text-rose-300"
                >
                  Quên mật khẩu?
                </button>
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
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-rose-600 focus:ring-rose-500/40"
                  />
                  <span>Đồng ý Điều khoản & Dịch vụ</span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-xs text-red-400">{errors.terms}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !formValid}
              className="auth-btn-primary auth-btn-shimmer relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> …
                </>
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
          <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300 backdrop-blur-md">
            {err}
          </p>
        )}
        {msg && (
          <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300 backdrop-blur-md">
            {msg}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link href="/cai-dat" className="text-sm text-rose-400/90 hover:text-rose-300 hover:underline">
            ← Cài đặt
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .auth-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.55;
          will-change: transform;
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
          top: 20%;
          right: -12%;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          animation-delay: -6s;
          animation-duration: 22s;
        }
        .auth-orb-3 {
          width: 300px;
          height: 300px;
          bottom: 5%;
          left: 30%;
          background: radial-gradient(circle, #fb923c 0%, transparent 70%);
          animation-delay: -12s;
          animation-duration: 20s;
        }
        @keyframes auth-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(4%, 6%, 0) scale(1.05);
          }
          66% {
            transform: translate3d(-5%, 3%, 0) scale(0.96);
          }
        }
        .auth-glass {
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.35),
            0 24px 64px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .auth-glass-border {
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.35) 0%,
            rgba(255, 255, 255, 0.05) 40%,
            transparent 60%,
            rgba(244, 63, 94, 0.25) 100%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.85;
        }
        .auth-btn-primary {
          background: linear-gradient(135deg, #e11d48, #f43f5e 40%, #fb7185);
          box-shadow: 0 8px 28px rgba(244, 63, 94, 0.35);
          transition:
            transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.25s ease,
            filter 0.2s ease;
        }
        .auth-btn-primary:hover:not(:disabled) {
          filter: brightness(1.08);
          box-shadow: 0 10px 36px rgba(244, 63, 94, 0.5);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: scale(0.96);
        }
        .auth-btn-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 60%
          );
          transform: translateX(-100%);
          transition: none;
        }
        .auth-btn-shimmer:hover:not(:disabled)::after {
          animation: auth-shimmer 0.85s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes auth-shimmer {
          to {
            transform: translateX(100%);
          }
        }
        .auth-enter {
          animation: auth-rise 0.65s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes auth-rise {
          from {
            opacity: 0;
            transform: translate3d(0, 20px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .auth-stagger-1 {
          animation: auth-rise 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.05s both;
        }
        .auth-stagger-2 {
          animation: auth-rise 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.12s both;
        }
        .auth-stagger-3 {
          animation: auth-rise 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-orb,
          .auth-enter,
          .auth-stagger-1,
          .auth-stagger-2,
          .auth-stagger-3 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
