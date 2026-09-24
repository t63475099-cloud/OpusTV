"use client";

/**
 * /tai-khoan
 * - Chưa đăng nhập: form Đăng nhập / Đăng ký / Khôi phục
 * - Đã đăng nhập: chỉ AccountProfile (UI mới)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  PlayCircle,
  Check,
  Loader2,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import AccountProfile from "@/components/AccountProfile";

type Mode = "login" | "register" | "recover";

function validateUsername(v: string): string | undefined {
  const s = v.trim().toLowerCase();
  if (!s) return "Nhập tên tài khoản";
  if (s.length < 3) return "Tối thiểu 3 ký tự";
  if (s.length > 32) return "Tối đa 32 ký tự";
  if (!/^[a-z0-9._]+$/.test(s)) return "Chỉ a-z, 0-9, . và _";
  return undefined;
}

function validatePassword(v: string): string | undefined {
  if (v.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
  if (!/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v))
    return "Cần chữ hoa, chữ thường và số";
  return undefined;
}

function passwordStrength(pw: string): { score: number; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
  return { score: s, label: labels[s] || "" };
}

function resolvePostAuthPath(): string {
  if (typeof window === "undefined") return "/home";
  try {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    /* */
  }
  return "/home";
}

export default function AccountPage() {
  const { username, login, register, resetPassword } = useAccountStore();
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [pin, setPin] = useState("");
  const [inviteKey, setInviteKey] = useState("");
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);

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
    if (typeof window === "undefined") return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const k = sp.get("key");
      const m = sp.get("mode");
      if (m === "register" || m === "login" || m === "recover") setMode(m);
      if (k) setInviteKey(k.toUpperCase().slice(0, 24));
      if (username && sp.get("next")) {
        window.location.replace(resolvePostAuthPath());
      }
    } catch {
      /* */
    }
  }, [username]);

  const strength = useMemo(() => passwordStrength(pass), [pass]);

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
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setPass("");
        window.location.assign(resolvePostAuthPath());
      }
      return;
    }

    const res = await register(
      user.trim().toLowerCase(),
      pass,
      pin.trim(),
      inviteKey.trim()
    );
    setBusy(false);
    if (!res.ok) setErr(res.error || "Đăng ký thất bại");
    else {
      updateProfile({ name: displayName.slice(0, 80) });
      setPass("");
      setPass2("");
      setPin("");
      window.location.assign(resolvePostAuthPath());
    }
  };

  // ─── Đã đăng nhập: chỉ profile mới ───
  if (username) {
    return <AccountProfile />;
  }

  // ─── Form auth ───
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-10 sm:py-14">
      <div
        className={`relative z-10 mx-auto w-full max-w-[420px] ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        } transition duration-500`}
      >
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/25">
              <PlayCircle className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">OpusFilm</h1>
            <p className="mt-1.5 text-sm text-slate-500">Xem phim · Nhạc · Chat · Code</p>
          </div>

          {mode !== "recover" ? (
            <div className="mb-5 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-slate-100 p-1">
              {(
                [
                  ["login", "Đăng Nhập"],
                  ["register", "Đăng Ký"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                    mode === m
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-center text-sm font-semibold text-slate-800">
              Khôi phục mật khẩu
            </p>
          )}

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
            {mode === "register" ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
                placeholder="Tên hiển thị"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none focus:border-emerald-500"
              />
            ) : null}

            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Tên tài khoản"
              autoComplete="username"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 outline-none focus:border-emerald-500"
            />

            <div className="relative">
              <input
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                type={showPass ? "text" : "password"}
                placeholder="Mật khẩu"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-[15px] text-slate-900 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {mode === "register" && pass ? (
              <div className="space-y-1 px-0.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < strength.score
                          ? strength.score <= 1
                            ? "bg-red-400"
                            : strength.score === 2
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">{strength.label}</p>
              </div>
            ) : null}

            {(mode === "register" || mode === "recover") && (
              <div className="relative">
                <input
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  type={showPass2 ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-[15px] text-slate-900 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass2((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPass2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {(mode === "register" || mode === "recover") && (
              <div className="relative">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  placeholder={mode === "recover" ? "PIN khôi phục" : "PIN khôi phục (4–8 số)"}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-[15px] tracking-widest text-slate-900 outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-600">
                    Mã kích hoạt <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="https://link4m.org/FBlS5LG8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-amber-400/50 bg-amber-50 px-2.5 text-xs font-semibold text-amber-700"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Get Key
                  </a>
                </div>
                <input
                  value={inviteKey}
                  onChange={(e) => setInviteKey(e.target.value.toUpperCase().slice(0, 24))}
                  placeholder="OF-XXXX-XXXX-XXXX"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-[15px] tracking-wider text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between px-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                  />
                  Ghi nhớ
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("recover")}
                  className="text-sm font-medium text-emerald-600"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {mode === "register" && (
              <label className="flex cursor-pointer items-start gap-2 px-0.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <span>
                  Tôi đồng ý với{" "}
                  <Link href="/dieu-khoan" className="font-medium text-emerald-600 underline">
                    Điều khoản & Chính sách
                  </Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy || !formValid}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:opacity-50"
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
                  <Check className="h-4 w-4" /> Đặt lại mật khẩu
                </>
              )}
            </button>
          </form>

          {err ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-600">
              {err}
            </p>
          ) : null}
          {msg ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
              {msg}
            </p>
          ) : null}

          {mode === "recover" ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-4 w-full text-center text-sm text-slate-500 hover:text-emerald-600"
            >
              ← Về đăng nhập
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
