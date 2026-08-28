"use client";

import { useMemo, useState, useEffect } from "react";
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
  if (!/^[a-z0-9._]+$/.test(t)) return "Chỉ dùng a–z, 0–9, dấu chấm (.) và gạch dưới (_)";
  return undefined;
}

function validatePassword(pw: string, strict = true): string | undefined {
  if (!pw) return "Vui lòng nhập mật khẩu";
  if (pw.length < 8) return "Tối thiểu 8 ký tự";
  if (strict) {
    if (!/[a-z]/.test(pw)) return "Cần có chữ thường";
    if (!/[A-Z]/.test(pw)) return "Cần có chữ hoa";
    if (!/\d/.test(pw) && !/[^a-zA-Z0-9]/.test(pw)) return "Cần có số hoặc ký tự đặc biệt";
  }
  return undefined;
}

export default function AccountPage() {
  const { username, storage, lastSyncAt, login, register, logout, syncNow, resetPassword } =
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

  const strength = useMemo(() => passwordStrength(pass), [pass]);

  // Real-time validation
  useEffect(() => {
    const next: FieldErrors = {};
    if (touched.user || user) next.user = validateUsername(user);
    if (mode === "register" && (touched.displayName || displayName)) {
      if (!displayName.trim()) next.displayName = "Vui lòng nhập tên hiển thị";
      else if (displayName.trim().length < 2) next.displayName = "Tối thiểu 2 ký tự";
    }
    if (touched.pass || pass) {
      next.pass =
        mode === "login" ? (pass.length < 1 ? "Vui lòng nhập mật khẩu" : undefined) : validatePassword(pass);
    }
    if ((mode === "register" || mode === "recover") && (touched.pass2 || pass2)) {
      if (!pass2) next.pass2 = "Vui lòng xác nhận mật khẩu";
      else if (pass2 !== pass) next.pass2 = "Mật khẩu không khớp";
    }
    if ((mode === "register" || mode === "recover") && (touched.pin || pin)) {
      if (!/^\d{4,8}$/.test(pin.trim())) next.pin = "Mã khôi phục: 4–8 chữ số";
    }
    if (mode === "register" && touched.terms && !terms) {
      next.terms = "Bạn cần đồng ý Điều khoản & Dịch vụ";
    }
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
    // recover
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
      setErr("Vui lòng kiểm tra lại các trường chưa hợp lệ.");
      return;
    }
    setBusy(true);

    if (mode === "recover") {
      const res = await resetPassword(user.trim().toLowerCase(), pin.trim(), pass);
      setBusy(false);
      if (!res.ok) setErr(res.error || "Không đặt lại được mật khẩu");
      else {
        setMsg(res.message || "Đã đặt lại mật khẩu. Hãy đăng nhập.");
        setPass("");
        setPass2("");
        setPin("");
        switchMode("login");
      }
      return;
    }

    if (mode === "login") {
      if (typeof window !== "undefined") {
        if (remember) localStorage.setItem("opusfilm-remember", user.trim().toLowerCase());
        else localStorage.removeItem("opusfilm-remember");
      }
      const res = await login(user.trim().toLowerCase(), pass);
      setBusy(false);
      if (!res.ok) setErr(res.error || "Đăng nhập thất bại");
      else {
        setMsg("Đăng nhập thành công — dữ liệu đã được gộp & đồng bộ.");
        setPass("");
      }
      return;
    }

    // register
    const res = await register(user.trim().toLowerCase(), pass, pin.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || "Đăng ký thất bại");
    else {
      updateProfile({ name: displayName.trim().slice(0, 40) });
      setMsg("Tạo tài khoản thành công. Hãy ghi nhớ mã khôi phục để dùng khi quên mật khẩu.");
      setPass("");
      setPass2("");
      setPin("");
    }
  };

  const onSync = async () => {
    setBusy(true);
    setErr("");
    const res = await syncNow();
    setBusy(false);
    if (!res.ok) setErr(res.error || "Lỗi đồng bộ");
    else setMsg("Đã đồng bộ lên đám mây.");
  };

  const onSavePin = async () => {
    setPinMsg("");
    if (!/^\d{4,8}$/.test(newPin.trim())) {
      setPinMsg("Mã khôi phục: 4–8 chữ số");
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
      if (!data.ok) setPinMsg(data.error || "Lỗi");
      else {
        setPinMsg("Đã lưu mã khôi phục.");
        setNewPin("");
      }
    } catch {
      setPinMsg("Lỗi mạng");
    }
    setBusy(false);
  };

  useEffect(() => {
    try {
      const remembered = localStorage.getItem("opusfilm-remember");
      if (remembered) {
        setUser(remembered);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const inputBase =
    "w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-red-500/40";
  const inputOk = "border-white/10 focus:border-red-500/60";
  const inputErr = "border-red-500/50 focus:border-red-500";

  const EyeBtn = ({
    show,
    onToggle,
  }: {
    show: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs text-red-400">
        <X className="mt-0.5 h-3 w-3 shrink-0" /> {msg}
      </p>
    ) : null;

  // —— Logged in ——
  if (username) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-16 pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.15),_transparent_55%)]" />
        <div className="relative mx-auto max-w-md animate-fade-in">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-600/30">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Tài khoản</h1>
                <p className="text-sm text-zinc-400">Đã đăng nhập</p>
              </div>
            </div>
            <p className="text-white">
              Xin chào, <strong className="text-red-300">{username}</strong>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {storage === "neon" ? "Neon PostgreSQL · persistent" : "—"}
              {lastSyncAt ? ` · Đồng bộ ${new Date(lastSyncAt).toLocaleString("vi-VN")}` : ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSync}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Đồng bộ ngay
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setMsg("Đã đăng xuất.");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 transition hover:bg-zinc-700 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </button>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
              <p className="flex items-center gap-2 text-sm text-zinc-300">
                <KeyRound className="h-4 w-4 text-amber-400" /> Mã khôi phục (quên mật khẩu)
              </p>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="4–8 chữ số"
                  className={`${inputBase} ${inputOk} pr-11`}
                />
                <EyeBtn show={showPin} onToggle={() => setShowPin(!showPin)} />
              </div>
              <button
                type="button"
                onClick={onSavePin}
                disabled={busy}
                className="rounded-full bg-amber-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
              >
                Lưu mã khôi phục
              </button>
              {pinMsg && <p className="text-xs text-emerald-400">{pinMsg}</p>}
            </div>
          </div>
          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
          {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}
          <Link href="/cai-dat" className="mt-6 inline-block text-sm text-red-400 hover:underline">
            ← Về Cài đặt
          </Link>
        </div>
      </div>
    );
  }

  // —— Auth forms ——
  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-16 pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,_rgba(244,63,94,0.2),_transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_0%,_rgba(168,85,247,0.12),_transparent_50%)]" />

      <div className="relative mx-auto w-full max-w-[420px] animate-fade-in">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 shadow-lg shadow-red-600/40 ring-1 ring-white/20">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : "Khôi phục mật khẩu"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {mode === "login"
              ? "Đồng bộ lịch sử & yêu thích trên mọi thiết bị"
              : mode === "register"
                ? "Tài khoản OpusFilm — lưu trên Neon PostgreSQL"
                : "Dùng mã khôi phục đã lưu khi đăng ký"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1 backdrop-blur-md">
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
              className={`flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition duration-300 sm:text-sm ${
                mode === m
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-7"
        >
          {/* Display name — register only */}
          {mode === "register" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Họ và tên / Tên hiển thị</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                placeholder="Ví dụ: Phương Anh"
                autoComplete="name"
                className={`${inputBase} ${errors.displayName ? inputErr : inputOk}`}
              />
              <FieldError msg={errors.displayName} />
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Tên tài khoản
            </label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, user: true }))}
              placeholder="a–z, 0–9, . và _"
              autoComplete="username"
              className={`${inputBase} ${errors.user ? inputErr : inputOk}`}
            />
            <FieldError msg={errors.user} />
          </div>

          {/* Recovery pin — recover first, or register later */}
          {mode === "recover" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Mã khôi phục</label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onBlur={() => setTouched((t) => ({ ...t, pin: true }))}
                  placeholder="4–8 chữ số"
                  className={`${inputBase} pr-11 ${errors.pin ? inputErr : inputOk}`}
                />
                <EyeBtn show={showPin} onToggle={() => setShowPin(!showPin)} />
              </div>
              <FieldError msg={errors.pin} />
            </div>
          )}

          {/* Password */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              {mode === "recover" ? "Mật khẩu mới" : "Mật khẩu"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
                placeholder={mode === "login" ? "••••••••" : "Tối thiểu 8 ký tự"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`${inputBase} pr-11 ${errors.pass ? inputErr : inputOk}`}
              />
              <EyeBtn show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>
            <FieldError msg={errors.pass} />

            {/* Strength — register & recover */}
            {(mode === "register" || mode === "recover") && pass && (
              <div className="mt-2.5">
                <div className="mb-1 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        strength.score >= i ? strength.color : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Độ mạnh: <span className="font-medium text-zinc-200">{strength.label}</span>
                  {" · "}Có chữ hoa, thường, số/ký tự đặc biệt
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          {(mode === "register" || mode === "recover") && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                {mode === "recover" ? "Xác nhận mật khẩu mới" : "Xác nhận mật khẩu"}
              </label>
              <div className="relative">
                <input
                  type={showPass2 ? "text" : "password"}
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, pass2: true }))}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className={`${inputBase} pr-11 ${errors.pass2 ? inputErr : inputOk}`}
                />
                <EyeBtn show={showPass2} onToggle={() => setShowPass2(!showPass2)} />
              </div>
              <FieldError msg={errors.pass2} />
              {!errors.pass2 && pass2 && pass === pass2 && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400">
                  <Check className="h-3 w-3" /> Mật khẩu khớp
                </p>
              )}
            </div>
          )}

          {/* Recovery pin on register */}
          {mode === "register" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Mã khôi phục (bắt buộc)
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  onBlur={() => setTouched((t) => ({ ...t, pin: true }))}
                  placeholder="4–8 chữ số — dùng khi quên mật khẩu"
                  className={`${inputBase} pr-11 ${errors.pin ? inputErr : inputOk}`}
                />
                <EyeBtn show={showPin} onToggle={() => setShowPin(!showPin)} />
              </div>
              <FieldError msg={errors.pin} />
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-400/90">
                Ghi nhớ mã này. Không chia sẻ cho người khác.
              </p>
            </div>
          )}

          {/* Remember me — login */}
          {mode === "login" && (
            <div className="mb-5 flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/40 text-red-600 focus:ring-red-500/40"
                />
                Ghi nhớ đăng nhập
              </label>
              <button
                type="button"
                onClick={() => switchMode("recover")}
                className="text-sm font-medium text-red-400 transition hover:text-red-300 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          {/* Terms — register */}
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
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-red-600 focus:ring-red-500/40"
                />
                <span>
                  Tôi đồng ý với{" "}
                  <span className="text-red-400 underline-offset-2 hover:underline">
                    Điều khoản & Dịch vụ
                  </span>{" "}
                  của OpusFilm
                </span>
              </label>
              <FieldError msg={errors.terms} />
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !formValid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý…
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

        {err && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {err}
          </p>
        )}
        {msg && (
          <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-sm text-emerald-300">
            {msg}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-zinc-600">
          Không dùng đăng nhập mạng xã hội · Mật khẩu được băm bcrypt
        </p>
        <div className="mt-3 text-center">
          <Link href="/cai-dat" className="text-sm text-red-400 hover:underline">
            ← Về Cài đặt
          </Link>
        </div>
      </div>
    </div>
  );
}
