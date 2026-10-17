/* Lucian UX/UI Prompt #062 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#062 */
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { LucianLockoutCard } from "@/components/auth/LucianLockoutCard";

export type AuthMode = "login" | "register" | "recover";

const MAX_LOGIN_TRIES = 5;
const LOCKOUT_SECONDS = 60;

type Props = {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  initialUsername?: string;
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onRegister: (data: {
    username: string;
    password: string;
    pin: string;
    inviteKey: string;
    displayName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onRecover: (username: string, pin: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSuccessNavigate?: () => void;
};

export function LucianSignInCard({
  mode,
  onModeChange,
  initialUsername = "",
  onLogin,
  onRegister,
  onRecover,
  onSuccessNavigate,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [pin, setPin] = useState("");
  const [inviteKey, setInviteKey] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [bad, setBad] = useState(false);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(MAX_LOGIN_TRIES);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [isIn, setIsIn] = useState(false);
  const [shake, setShake] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    setBad(false);
    setErr("");
    setOk(false);
    setIsIn(false);
    setBusy(false);
    setPassword("");
    setPassword2("");
    setPin("");
    setLeft(MAX_LOGIN_TRIES);
    setLocked(false);
  }, [mode]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const clearShake = useCallback(() => setShake(false), []);

  const title =
    mode === "login" ? "Chào mừng trở lại" : mode === "register" ? "Tạo tài khoản" : "Khôi phục mật khẩu";
  const subtitle =
    mode === "login"
      ? "Đăng nhập tài khoản OpusFilm"
      : mode === "register"
        ? "Đăng ký để xem phim, lưu lịch sử và đồng bộ"
        : "Nhập PIN khôi phục để đặt mật khẩu mới";
  const submitLabel =
    mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Đặt lại mật khẩu";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || ok) return;
    const u = username.trim().toLowerCase();
    if (!u) {
      setBad(true);
      setErr("Nhập tên tài khoản");
      setShake(true);
      return;
    }
    if (mode === "login") {
      if (!password) {
        setBad(true);
        setErr("Nhập mật khẩu");
        setShake(true);
        return;
      }
      setBusy(true);
      setBad(false);
      setErr("");
      const started = Date.now();
      const res = await onLogin(u, password);
      const wait = Math.max(0, 900 - (Date.now() - started));
      await new Promise((r) => { timerRef.current = setTimeout(r, wait); });
      if (!res.ok) {
        setBusy(false);
        const next = Math.max(0, left - 1);
        setLeft(next);
        if (next <= 0) {
          setLocked(true);
          setErr("");
          setBad(false);
          return;
        }
        setErr(
          res.error ||
            `Sai mật khẩu · còn ${next} lần thử`
        );
        setBad(true);
        setShake(false);
        requestAnimationFrame(() => setShake(true));
        pwRef.current?.select();
        return;
      }
      setOk(true);
      setWelcomeName(u);
      timerRef.current = setTimeout(() => {
        setIsIn(true);
        setBusy(false);
        backRef.current?.focus({ preventScroll: true });
      }, 650);
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        setBad(true);
        setErr("Mật khẩu tối thiểu 8 ký tự");
        setShake(true);
        return;
      }
      if (password !== password2) {
        setBad(true);
        setErr("Mật khẩu xác nhận không khớp");
        setShake(true);
        return;
      }
      if (pin.trim().length < 4) {
        setBad(true);
        setErr("PIN khôi phục 4–8 số");
        setShake(true);
        return;
      }
      setBusy(true);
      setBad(false);
      setErr("");
      const res = await onRegister({
        username: u,
        password,
        pin: pin.trim(),
        inviteKey: inviteKey.trim(),
        displayName: displayName.trim(),
      });
      setBusy(false);
      if (!res.ok) {
        setBad(true);
        setErr(res.error || "Đăng ký thất bại");
        setShake(true);
        return;
      }
      setOk(true);
      setWelcomeName(u);
      timerRef.current = setTimeout(() => {
        setIsIn(true);
        backRef.current?.focus({ preventScroll: true });
      }, 400);
      return;
    }

    // recover
    if (pin.trim().length < 4) {
      setBad(true);
      setErr("Nhập PIN khôi phục");
      setShake(true);
      return;
    }
    if (password.length < 8 || password !== password2) {
      setBad(true);
      setErr(password !== password2 ? "Mật khẩu xác nhận không khớp" : "Mật khẩu tối thiểu 8 ký tự");
      setShake(true);
      return;
    }
    setBusy(true);
    setBad(false);
    setErr("");
    const res = await onRecover(u, pin.trim(), password);
    setBusy(false);
    if (!res.ok) {
      setBad(true);
      setErr(res.error || "Khôi phục thất bại");
      setShake(true);
      return;
    }
    setOk(true);
    setErr("");
    timerRef.current = setTimeout(() => {
      setOk(false);
      onModeChange("login");
    }, 800);
  };

  const resetCard = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsIn(false);
    setOk(false);
    setBusy(false);
    setLeft(MAX_LOGIN_TRIES);
    setLocked(false);
    setPassword("");
    setBad(false);
    setErr("");
    setTimeout(() => pwRef.current?.focus({ preventScroll: true }), 50);
  };

  if (locked && mode === "login") {
    return (
      <LucianLockoutCard
        lockSeconds={LOCKOUT_SECONDS}
        failCount={MAX_LOGIN_TRIES}
        onUnlocked={() => {
          setLocked(false);
          setLeft(MAX_LOGIN_TRIES);
          setPassword("");
          setBad(false);
          setErr("");
          setTimeout(() => pwRef.current?.focus({ preventScroll: true }), 80);
        }}
        onRecoverInstead={() => {
          setLocked(false);
          setLeft(MAX_LOGIN_TRIES);
          onModeChange("recover");
        }}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      className={`ux u062${shake ? " shake" : ""}${isIn ? " is-in" : ""}${mode !== "login" ? " u062-tall" : ""}`}
      onAnimationEnd={(e) => { if (e.target === rootRef.current) clearShake(); }}
    >
      <form className="u062-pane u062-login" noValidate onSubmit={(e) => void submit(e)}>
        <span className="u062-logo" aria-hidden="true" />
        <h3>{title}</h3>
        <p>{subtitle}</p>

        <div className="u062-tabs" role="tablist">
          {([
            ["login", "Đăng nhập"],
            ["register", "Đăng ký"],
            ["recover", "Khôi phục"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              className={mode === id ? "on" : undefined}
              onClick={() => onModeChange(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="u062-f">
          <label htmlFor={`${uid}-user`}>Tên tài khoản</label>
          <div className="u062-box">
            <input
              id={`${uid}-user`}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              spellCheck={false}
            />
          </div>
        </div>

        {mode === "register" ? (
          <div className="u062-f">
            <label htmlFor={`${uid}-dn`}>Tên hiển thị (tuỳ chọn)</label>
            <div className="u062-box">
              <input
                id={`${uid}-dn`}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tên hiển thị"
              />
            </div>
          </div>
        ) : null}

        {(mode === "register" || mode === "recover") ? (
          <div className="u062-f">
            <label htmlFor={`${uid}-pin`}>PIN khôi phục</label>
            <div className="u062-box">
              <input
                id={`${uid}-pin`}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="4–8 số"
              />
            </div>
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="u062-f">
            <label htmlFor={`${uid}-key`}>Mã kích hoạt (nếu có)</label>
            <div className="u062-box">
              <input
                id={`${uid}-key`}
                type="text"
                value={inviteKey}
                onChange={(e) => setInviteKey(e.target.value)}
                placeholder="Key / invite"
                spellCheck={false}
              />
            </div>
          </div>
        ) : null}

        <div className={`u062-f u062-pw${bad ? " bad" : ""}`}>
          <label htmlFor={`${uid}-pw`}>
            {mode === "recover" ? "Mật khẩu mới" : "Mật khẩu"}
          </label>
          <span className={`u062-caps${caps ? " on" : ""}`} aria-live="polite">
            Caps Lock đang bật
          </span>
          <div className="u062-box">
            <input
              ref={pwRef}
              id={`${uid}-pw`}
              type={showPw ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Nhập mật khẩu"
              value={password}
              aria-invalid={bad || undefined}
              aria-describedby={`${uid}-e`}
              onChange={(e) => {
                setPassword(e.target.value);
                setBad(false);
                setErr("");
              }}
              onKeyUp={(e) => {
                if (e.getModifierState) setCaps(e.getModifierState("CapsLock"));
              }}
            />
            <button
              className="u062-eye"
              type="button"
              aria-pressed={showPw}
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPw((v) => !v)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <g className="u062-lid">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </g>
                <path className="u062-slash" d="M4 4l16 16" />
              </svg>
            </button>
          </div>
          <div className="u062-err">
            <span id={`${uid}-e`} role="alert">
              {err}
            </span>
          </div>
        </div>

        {(mode === "register" || mode === "recover") ? (
          <div className="u062-f">
            <label htmlFor={`${uid}-pw2`}>Xác nhận mật khẩu</label>
            <div className="u062-box">
              <input
                id={`${uid}-pw2`}
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>
        ) : null}

        {mode === "login" ? (
          <div className="u062-row">
            <button
              type="button"
              className="u062-link"
              onClick={() => onModeChange("recover")}
            >
              Quên mật khẩu?
            </button>
          </div>
        ) : null}

        <button
          className={`u062-go${busy ? " busy" : ""}${ok && mode !== "recover" ? " ok" : ""}`}
          type="submit"
          aria-label={busy ? "Đang kiểm tra" : ok ? "Thành công" : undefined}
        >
          <span>{submitLabel}</span>
          <i aria-hidden="true" />
          <svg viewBox="0 0 26 26" aria-hidden="true">
            <path d="M6 13.5l4.5 4.5L20 8.5" />
          </svg>
        </button>
      </form>

      <div className="u062-pane u062-hi" aria-hidden={!isIn}>
        <span className="u062-av" aria-hidden="true" />
        <h3>Xin chào, {welcomeName || "bạn"}</h3>
        <p>
          {mode === "register" ? "Tài khoản đã sẵn sàng · OpusFilm" : "Đăng nhập thành công · OpusFilm"}
        </p>
        <button
          ref={backRef}
          type="button"
          tabIndex={isIn ? 0 : -1}
          onClick={() =>
            onSuccessNavigate ? onSuccessNavigate() : window.location.assign("/home")
          }
        >
          Vào trang chủ
        </button>
        <button type="button" tabIndex={isIn ? 0 : -1} onClick={resetCard}>
          Dùng tài khoản khác
        </button>
      </div>

      <style jsx global>{`
.u062{--ux-page:var(--background,#f8fafc);--ux-surface:var(--surface,#fff);--ux-surface-2:var(--surface-elevated,#f1f5f9);--ux-ink:var(--foreground,#0f172a);--ux-ink-2:var(--foreground-muted,#475569);--ux-ink-3:var(--foreground-subtle,#94a3b8);--ux-line:var(--border,rgba(15,23,42,.1));--ux-accent:#7c3aed;--ux-accent-soft:rgba(124,58,237,.14);--ux-accent-ink:#fff;--ux-mint:#119c72;--ux-warn:#d6731e;--ux-danger:#d93a55;--ux-shadow-strong:rgba(40,30,80,.3);--ux-grad:linear-gradient(120deg,#7b61ff,#3d8bff 55%,#1fb89a);--ux-ease:cubic-bezier(.2,.8,.2,1);--ux-spring:cubic-bezier(.34,1.45,.64,1);position:relative;width:100%;max-width:360px;min-height:480px;height:auto;margin:0 auto;border-radius:30px;background:var(--ux-surface);box-shadow:0 0 0 1px var(--ux-line),0 30px 60px -36px var(--ux-shadow-strong);overflow:hidden;color:var(--ux-ink);font-family:inherit}
.u062.u062-tall{min-height:580px}
html[data-theme=dark] .u062,html.dark .u062{--ux-page:var(--background,#07080d);--ux-surface:var(--surface,#13141c);--ux-surface-2:var(--surface-elevated,#1a1b25);--ux-ink:var(--foreground,#f4f0e8);--ux-ink-2:var(--foreground-muted,rgba(244,240,232,.68));--ux-ink-3:var(--foreground-subtle,rgba(244,240,232,.42));--ux-line:var(--border,rgba(255,255,255,.08));--ux-accent:#b7a4ff;--ux-accent-soft:rgba(183,164,255,.15);--ux-accent-ink:#0b0c12;--ux-mint:#7ee8c0;--ux-warn:#ffb26b;--ux-danger:#ff7d8c;--ux-shadow-strong:rgba(0,0,0,.72);--ux-grad:linear-gradient(120deg,#b7a4ff,#7db4ff 55%,#a5f2d3)}
.u062 *,.u062 *::before,.u062 *::after{box-sizing:border-box}
.u062.shake{animation:u062-no .5s cubic-bezier(.36,.07,.19,.97)}
@keyframes u062-no{15%{transform:translateX(-9px) rotate(-.6deg)}30%{transform:translateX(8px) rotate(.5deg)}45%{transform:translateX(-6px)}60%{transform:translateX(4px)}75%{transform:translateX(-2px)}}
.u062-pane{position:relative;padding:28px 24px 24px;display:flex;flex-direction:column;min-height:inherit}
.u062-hi{position:absolute;inset:0;padding:28px 24px}
.u062-logo{width:44px;height:44px;border-radius:14px;background:var(--ux-grad);box-shadow:0 10px 20px -10px rgba(91,72,255,.6);flex-shrink:0}
.u062-pane h3{margin:16px 0 4px;font-size:22px;font-weight:800;letter-spacing:-.04em}
.u062-pane>p{margin:0 0 14px;font-size:13.5px;color:var(--ux-ink-3)}
.u062-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;padding:4px;margin-bottom:14px;border-radius:14px;background:var(--ux-surface-2)}
.u062-tabs button{border:0;border-radius:11px;padding:8px 4px;font-size:12px;font-weight:700;background:transparent;color:var(--ux-ink-3);cursor:pointer}
.u062-tabs button.on{background:var(--ux-surface);color:var(--ux-ink);box-shadow:0 1px 3px var(--ux-shadow-strong)}
.u062-f{position:relative;margin-bottom:10px}
.u062-f label{display:block;margin-bottom:5px;font-size:12px;font-weight:700;color:var(--ux-ink-2)}
.u062-box{display:flex;align-items:center;height:48px;border-radius:14px;background:var(--ux-surface-2);box-shadow:inset 0 0 0 1.5px transparent;transition:box-shadow .25s,background-color .25s}
.u062-box:focus-within{background:var(--ux-surface);box-shadow:inset 0 0 0 1.5px var(--ux-accent),0 0 0 4px var(--ux-accent-soft)}
.u062-f.bad .u062-box{box-shadow:inset 0 0 0 1.5px var(--ux-danger);background:color-mix(in srgb,var(--ux-danger) 6%,var(--ux-surface))}
.u062-box input{flex:1;min-width:0;height:100%;border:0;padding:0 14px;background:none;font-size:14.5px;font-weight:600;color:var(--ux-ink);outline:none}
.u062-box input::placeholder{color:var(--ux-ink-3);font-weight:500}
.u062-eye{width:40px;height:40px;margin-right:4px;border:0;border-radius:12px;display:grid;place-items:center;background:none;color:var(--ux-ink-3);cursor:pointer}
.u062-eye:hover{color:var(--ux-ink)}
.u062-eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.u062-lid{transform-origin:12px 12px;transition:transform .35s var(--ux-spring)}
.u062-eye[aria-pressed=false] .u062-lid{transform:scaleY(.5)}
.u062-slash{stroke-dasharray:24;stroke-dashoffset:0;transition:stroke-dashoffset .35s var(--ux-ease)}
.u062-eye[aria-pressed=true] .u062-slash{stroke-dashoffset:24}
.u062-caps{position:absolute;right:0;top:0;font-size:11px;font-weight:800;color:var(--ux-warn);opacity:0;transition:opacity .2s}
.u062-caps.on{opacity:1}
.u062-err{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s var(--ux-ease)}
.u062-err>span{overflow:hidden;min-height:0;font-size:12.5px;font-weight:650;color:var(--ux-danger)}
.u062-err>span::before{content:"";display:block;height:6px}
.u062-f.bad .u062-err{grid-template-rows:1fr}
.u062-row{display:flex;justify-content:flex-end;margin-bottom:4px}
.u062-link{border:0;background:none;font-size:12.5px;font-weight:700;color:var(--ux-accent);cursor:pointer;padding:0}
.u062-go{position:relative;align-self:center;width:100%;height:52px;margin-top:12px;border:0;border-radius:16px;background:var(--ux-ink);color:var(--ux-page);font-size:15px;font-weight:760;overflow:hidden;cursor:pointer;transition:width .45s var(--ux-spring),border-radius .45s var(--ux-spring),background-color .4s,transform .3s var(--ux-spring)}
.u062-go:active{transform:scale(.97)}
.u062-go span{transition:opacity .2s}
.u062-go i{position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2.5px solid currentColor;border-right-color:transparent;opacity:0;animation:u062-spin .7s linear infinite}
.u062-go svg{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.u062-go svg path{stroke-dasharray:26;stroke-dashoffset:26;transition:stroke-dashoffset .4s var(--ux-ease) .1s}
.u062-go.busy,.u062-go.ok{width:52px;border-radius:26px}
.u062-go.busy span,.u062-go.ok span{opacity:0}
.u062-go.busy i{opacity:1}
.u062-go.ok{background:var(--ux-mint);color:var(--ux-accent-ink)}
.u062-go.ok svg path{stroke-dashoffset:0}
@keyframes u062-spin{to{transform:rotate(360deg)}}
.u062-hi{transform:translateX(100%);opacity:0;align-items:center;justify-content:center;text-align:center;pointer-events:none;display:flex;flex-direction:column}
.u062.is-in .u062-login{transform:translateX(-30%);opacity:0;pointer-events:none;position:absolute;inset:0}
.u062.is-in .u062-hi{transform:none;opacity:1;pointer-events:auto}
.u062-av{width:88px;height:88px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#ffe2c2,#f2a27a 45%,#b5577a);box-shadow:0 0 0 6px var(--ux-surface),0 0 0 8px var(--ux-mint)}
.u062-hi h3{margin-top:22px}
.u062-hi button{margin-top:14px;height:44px;padding:0 18px;border:0;border-radius:999px;background:var(--ux-surface-2);color:var(--ux-ink);font-size:13.5px;font-weight:700;cursor:pointer}
.u062-hi button:first-of-type{background:var(--ux-ink);color:var(--ux-page)}
@media (prefers-reduced-motion:reduce){.u062,.u062 *,.u062 *::before,.u062 *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
      `}</style>
    </div>
  );
}
