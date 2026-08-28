"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  LogIn,
  LogOut,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";

type Mode = "login" | "register" | "recover";

export default function AccountPage() {
  const { username, storage, lastSyncAt, login, register, logout, syncNow, resetPassword } =
    useAccountStore();
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [pin, setPin] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (mode === "register") {
      if (pass !== pass2) {
        setErr("Mật khẩu nhập lại không khớp");
        return;
      }
      if (!/^\d{4,8}$/.test(pin.trim())) {
        setErr("Mã khôi phục: 4–8 chữ số");
        return;
      }
    }

    if (mode === "recover") {
      if (pass !== pass2) {
        setErr("Mật khẩu mới nhập lại không khớp");
        return;
      }
      if (pass.length < 6) {
        setErr("Mật khẩu mới tối thiểu 6 ký tự");
        return;
      }
      setBusy(true);
      const res = await resetPassword(user.trim(), pin.trim(), pass);
      setBusy(false);
      if (!res.ok) setErr(res.error || "Thất bại");
      else {
        setMsg(res.message || "Đã đặt lại mật khẩu. Hãy đăng nhập.");
        setMode("login");
        setPass("");
        setPass2("");
        setPin("");
      }
      return;
    }

    setBusy(true);
    const res =
      mode === "login"
        ? await login(user.trim(), pass)
        : await register(user.trim(), pass, pin.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || "Thất bại");
    else {
      setMsg(
        mode === "login"
          ? "Đăng nhập thành công — dữ liệu đã được gộp & đồng bộ."
          : "Đăng ký thành công — hãy ghi nhớ mã khôi phục để dùng khi quên mật khẩu."
      );
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

  const fieldClass =
    "w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-red-500 pr-11";

  const PasswordField = ({
    value,
    onChange,
    placeholder,
    show,
    setShow,
    autoComplete,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    show: boolean;
    setShow: (v: boolean) => void;
    autoComplete?: string;
  }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={fieldClass}
        required
        minLength={mode === "recover" || mode === "register" || mode === "login" ? 6 : undefined}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 max-w-md mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
        <Shield className="w-6 h-6 text-red-500" /> Tài khoản
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        Đăng ký / đăng nhập để đồng bộ lịch sử, yêu thích, nhạc đã xem giữa Android, iPhone và PC.
      </p>

      {username ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 glass-card">
          <p className="text-white">
            Đang đăng nhập: <strong>{username}</strong>
          </p>
          <p className="text-xs text-zinc-500">
            Lưu trữ: {storage === "neon" ? "Neon PostgreSQL (persistent)" : "—"}
            {lastSyncAt ? ` · Đồng bộ lúc ${new Date(lastSyncAt).toLocaleString("vi-VN")}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSync}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium btn-press"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
              Đồng bộ ngay
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                setMsg("Đã đăng xuất trên thiết bị này.");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-zinc-200 text-sm"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>

          <div className="pt-3 border-t border-white/10 space-y-2">
            <p className="text-sm text-zinc-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" /> Mã khôi phục (khi quên mật khẩu)
            </p>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="4–8 chữ số"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={onSavePin}
              disabled={busy}
              className="px-4 py-2 rounded-full bg-amber-600/90 text-white text-sm font-medium"
            >
              Lưu mã khôi phục
            </button>
            {pinMsg && <p className="text-xs text-emerald-400">{pinMsg}</p>}
          </div>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 glass-card"
        >
          <div className="flex gap-1.5 mb-2 flex-wrap">
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
                onClick={() => {
                  setMode(m);
                  setErr("");
                  setMsg("");
                }}
                className={`flex-1 min-w-[30%] py-2 rounded-xl text-xs sm:text-sm font-medium transition ${
                  mode === m ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5 inline mr-1" /> {label}
              </button>
            ))}
          </div>

          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Tên tài khoản"
            autoComplete="username"
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-red-500"
            required
            minLength={3}
          />

          {mode === "recover" && (
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Mã khôi phục (4–8 số)"
                className={fieldClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          <PasswordField
            value={pass}
            onChange={setPass}
            placeholder={mode === "recover" ? "Mật khẩu mới" : "Mật khẩu"}
            show={showPass}
            setShow={setShowPass}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {(mode === "register" || mode === "recover") && (
            <PasswordField
              value={pass2}
              onChange={setPass2}
              placeholder={mode === "recover" ? "Nhập lại mật khẩu mới" : "Nhập lại mật khẩu"}
              show={showPass2}
              setShow={setShowPass2}
              autoComplete="new-password"
            />
          )}

          {mode === "register" && (
            <>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Mã khôi phục (4–8 chữ số) *"
                  className={fieldClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-400/90 leading-relaxed">
                Ghi nhớ mã khôi phục này. Khi quên mật khẩu, dùng mã + tên tài khoản để đặt mật khẩu
                mới. Không chia sẻ mã cho người khác.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm disabled:opacity-60 btn-press"
          >
            {busy
              ? "Đang xử lý…"
              : mode === "login"
                ? "Đăng nhập"
                : mode === "register"
                  ? "Tạo tài khoản"
                  : "Đặt lại mật khẩu"}
          </button>
        </form>
      )}

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      {msg && <p className="mt-3 text-sm text-emerald-400">{msg}</p>}

      <div className="mt-8 text-xs text-zinc-600 space-y-2">
        <p>
          Database: Neon PostgreSQL. Tài khoản tồn tại sau redeploy. Mật khẩu được băm (bcrypt),
          không lưu dạng text.
        </p>
        <Link href="/cai-dat" className="text-red-400 hover:underline">
          ← Về Cài đặt
        </Link>
      </div>
    </div>
  );
}
