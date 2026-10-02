"use client";

import { useEffect, useState } from "react";
import {
  THEME_OPTIONS,
  applyTheme,
  readTheme,
  type ThemeMode,
} from "@/lib/themeLocale";

/** Compact cycle control — Dark → Light → System */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMode(readTheme());
    setReady(true);
  }, []);

  if (!ready) return null;

  const label =
    THEME_OPTIONS.find((o) => o.value === mode)?.labelVi || mode;

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground ui-border-contrast ${className}`}
      aria-label={`Giao diện: ${label}`}
      title={`Giao diện: ${label}`}
      onClick={() => {
        const order: ThemeMode[] = ["dark", "light", "system"];
        const next = order[(order.indexOf(mode) + 1) % order.length];
        setMode(next);
        applyTheme(next);
      }}
    >
      <span aria-hidden>
        {mode === "dark" ? "☾" : mode === "light" ? "☀" : "◐"}
      </span>
      {label}
    </button>
  );
}

export default ThemeToggle;
