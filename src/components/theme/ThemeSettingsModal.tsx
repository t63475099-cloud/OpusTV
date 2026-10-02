"use client";

import { useEffect, useState } from "react";
import {
  THEME_OPTIONS,
  applyHighContrast,
  applyTheme,
  readHighContrast,
  readTheme,
  type ThemeMode,
} from "@/lib/themeLocale";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ThemeSettingsModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [highContrast, setHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(readTheme());
    setHighContrast(readHighContrast());
  }, [open]);

  if (!mounted || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl ui-border-contrast"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="theme-settings-title"
          className="text-base font-semibold text-foreground"
        >
          Giao diện
        </h2>

        <p className="mt-3 text-xs text-foreground-muted">Chế độ màu</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                setMode(m.value);
                applyTheme(m.value);
              }}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ui-border-contrast ${
                mode === m.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-elevated text-foreground"
              }`}
            >
              {m.labelVi}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border ui-border-contrast">
          <div className="banner-scrim flex h-20 items-end p-3">
            <span className="text-sm font-semibold text-foreground">
              Xem trước tương phản
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 bg-surface-elevated p-3">
            <span className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] font-medium text-badge tabular-nums">
              HD
            </span>
            <span className="text-xs text-foreground-muted">Phụ đề</span>
            <span className="text-xs text-foreground-subtle">Nhãn phụ</span>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-3 ui-border-contrast">
          <span className="text-sm text-foreground">
            Tương phản cao (WCAG AAA)
          </span>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => {
              const on = e.target.checked;
              setHighContrast(on);
              applyHighContrast(on);
            }}
            className="h-4 w-4 accent-[var(--primary)]"
          />
        </label>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground ui-border-contrast"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThemeSettingsModal;
