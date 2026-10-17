"use client";

/**
 * /tai-khoan
 * - Chưa đăng nhập: Lucian Auth Card (#062) — login / register / recover
 * - Đã đăng nhập: AccountProfile
 */

import { useEffect, useState } from "react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import AccountProfile from "@/components/AccountProfile";
import { LucianSignInCard, type AuthMode } from "@/components/auth/LucianSignInCard";

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

  const [mode, setMode] = useState<AuthMode>("login");
  const [rememberUser, setRememberUser] = useState("");

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "register" || q === "login" || q === "recover") setMode(q);
      const saved = localStorage.getItem("opusfilm-remember") || "";
      if (saved) setRememberUser(saved);
    } catch {
      /* */
    }
  }, []);

  if (username) {
    return <AccountProfile />;
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background px-4 py-10 sm:py-14">
      <LucianSignInCard
        mode={mode}
        onModeChange={setMode}
        initialUsername={rememberUser}
        onLogin={async (u, p) => {
          try {
            localStorage.setItem("opusfilm-remember", u);
          } catch {
            /* */
          }
          const res = await login(u, p);
          return { ok: !!res.ok, error: res.error };
        }}
        onRegister={async (data) => {
          const res = await register(
            data.username,
            data.password,
            data.pin,
            data.inviteKey
          );
          if (res.ok && data.displayName) {
            updateProfile({ name: data.displayName.slice(0, 80) });
          }
          return { ok: !!res.ok, error: res.error };
        }}
        onRecover={async (u, pin, p) => {
          const res = await resetPassword(u, pin, p);
          return { ok: !!res.ok, error: res.error };
        }}
        onSuccessNavigate={() => {
          window.location.assign(resolvePostAuthPath());
        }}
      />
    </div>
  );
}
