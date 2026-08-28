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
  phone?: string;
  pass?: string;
  pass2?: string;
  otp?: string;
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

function validatePhone(v: string): string | undefined {
  const p = v.replace(/[\s\-().]/g, "");
  if (!p) return "Vui lòng nhập số điện thoại";
  if (!/^(0\d{9}|\+?84\d{9}|\+[1-9]\d{8,14})$/.test(p)) return "Số điện thoại không hợp lệ";
  return undefined;
}

function AuroraBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#05050a]" />
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`auth-glass relative ${className}`}>
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
            ? "border-red-500/50 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
            : "border-white/10 focus:border-rose-400/60 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"
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
  const { username, lastSyncAt, login, register, logout, syncNow, resetPassword, sendOtp } =
    useAccountStore();
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [displayedOtp, setDisplayedOtp] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setRetryAfter((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [retryAfter > 0]);

  useEffect(() => {
    const next: FieldErrors = {};
    if (touched.user || user) next.user = validateUsername(user);
    if (mode === "register" && (touched.displayName || displayName)) {
      if (!displayName.trim() || displayName.trim().length < 2) next.displayName = "Tối thiểu 2 ký tự";
    }
    if ((mode === "register" || mode === "recover") && (touched.phone || phone)) {
      next.phone = validatePhone(phone);
    }
    if (touched.pass || pass) {
      next.pass =
        mode === "login" ? (pass.length < 1 ? "Vui lòng nhập mật khẩu" : undefined) : validatePassword(pass);
    }
    if ((mode === "register" || mode === "recover") && (touched.pass2 || pass2)) {
      if (!pass2) next.pass2 = "Xác nhận mật khẩu";
      else if (pass2 !== pass) next.pass2 = "Mật khẩu không khớp";
    }
    if (mode === "recover" && otpSent && (touched.otp || otp)) {
      if (!/^\d{6}$/.test(otp.trim())) next.otp = "OTP 6 số";
    }
    if (mode === "register" && touched.terms && !terms) next.terms = "Cần đồng ý điều khoản";
    setErrors(next);
  }, [user, displayName, phone, pass, pass2, otp, terms, mode, touched, otpSent]);

  const formValid = useMemo(() => {
    if (validateUsername(user)) return false;
    if (mode === "login") return pass.length >= 1;
    if (mode === "register") {
      if (!displayName.trim() || displayName.trim().length < 2) return false;
      if (validatePhone(phone)) return false;
      if (validatePassword(pass)) return false;
      if (pass !== pass2) return false;
      if (!terms) return false;
      return true;
    }
    if (validatePhone(phone)) return false;
    if (!otpSent) return false;
    if (!/^\d{6}$/.test(otp.trim())) return false;
    if (validatePassword(pass)) return false;
    if (pass !== pass2) return false;
    return true;
  }, [user, displayName, phone, pass, pass2, otp, terms, mode, otpSent]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr("");
    setMsg("");
    setTouched({});
    setOtpSent(false);
    setOtp("");
    setDisplayedOtp("");
    setRetryAfter(0);
  };

  const onSendOtp = async () => {
    setErr("");
    setMsg("");
    setTouched((t) => ({ ...t, user: true, phone: true }));
    if (validateUsername(user) || validatePhone(phone)) {
      setErr("Kiểm tra tên tài khoản và số điện thoại.");
      return;
    }
    if (retryAfter > 0) return;
    setBusy(true);
    const res = await sendOtp(user.trim().toLowerCase(), phone.trim());
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "Không gửi OTP");
      if (res.retryAfter) setRetryAfter(res.retryAfter);
      return;
    }
    setOtpSent(true);
    setRetryAfter(res.retryAfter || 60);
    if (res.otp) {
      setDisplayedOtp(res.otp);
      setOtp(res.otp);
      setMsg(`Mã OTP: ${res.otp}`);
    } else {
      setMsg(res.message || "Đã tạo OTP");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      user: true,
      displayName: true,
      phone: true,
      pass: true,
      pass2: true,
      otp: true,
      terms: true,
    });
    setErr("");
    setMsg("");
    if (!formValid) {
      setErr("Kiểm tra lại thông tin.");
      return;
    }
    setBusy(true);

    if (mode === "recover") {
      const res = await resetPassword(
        user.trim().toLowerCase(),
        phone.trim(),
        otp.trim(),
        pass
      );
      setBusy(false);
      if (!res.ok) setErr(res.error || "Thất bại");
      else {
        setMsg(res.message || "Đã đặt lại mật khẩu.");
        setPass("");
        setPass2("");
        setOtp("");
        setOtpSent(false);
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

    const res = await register(user.trim().toLowerCase(), pass, phone.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || "Đăng ký thất bại");
    else {
      updateProfile({ name: displayName.trim().slice(0, 40) });
      setMsg("Tạo tài khoản thành công.");
      setPass("");
      setPass2("");
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
    return (
      <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
        <AuroraBg />
        <div className={`relative z-10 mx-auto max-w-md ${mounted ? "auth-enter" : "opacity-0"}`}>
          <GlassCard className="rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-600/40">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{username}</h1>
                <p className="text-xs text-zinc-400">
                  {lastSyncAt ? new Date(lastSyncAt).toLocaleString("vi-VN") : ""}
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
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/15 active:scale-95"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
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
        <AuthStyles />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-20 pt-24">
      <AuroraBg />
      <div className={`relative z-10 mx-auto w-full max-w-[420px] ${mounted ? "auth-enter" : "opacity-0"}`}>
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

        <GlassCard className="rounded-3xl p-5 sm:p-7">
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

            {(mode === "register" || mode === "recover") && (
              <FloatingField
                id="phone"
                label="Số điện thoại"
                value={phone}
                onChange={setPhone}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                inputMode="tel"
                autoComplete="tel"
                error={errors.phone}
              />
            )}

            {mode === "recover" && (
              <div className="mb-5 space-y-3">
                <button
                  type="button"
                  disabled={busy || retryAfter > 0 || !!validateUsername(user) || !!validatePhone(phone)}
                  onClick={onSendOtp}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-40 active:scale-[0.98]"
                >
                  {retryAfter > 0
                    ? `Tạo lại sau ${retryAfter}s`
                    : otpSent
                      ? "Tạo mã OTP mới"
                      : "Tạo mã OTP"}
                </button>
                {otpSent && displayedOtp && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-center backdrop-blur-md">
                    <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">Mã OTP</p>
                    <p className="text-3xl font-bold tracking-[0.35em] text-white font-mono select-all">
                      {displayedOtp}
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-500">Hiệu lực 5 phút</p>
                  </div>
                )}
                {otpSent && (
                  <FloatingField
                    id="otp"
                    label="Nhập lại mã OTP"
                    value={otp}
                    onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                    onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
                    inputMode="numeric"
                    error={errors.otp}
                  />
                )}
              </div>
            )}

            {(mode !== "recover" || otpSent) && (
              <>
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
                            className={`h-1 flex-1 rounded-full transition-all ${
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
              </>
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

            {(mode !== "recover" || otpSent) && (
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
            )}
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
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.35),
          transparent 45%,
          rgba(244, 63, 94, 0.2)
        );
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
        background: linear-gradient(
          105deg,
          transparent 40%,
          rgba(255, 255, 255, 0.22) 50%,
          transparent 60%
        );
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
