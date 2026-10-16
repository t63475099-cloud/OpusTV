"use client";

import { useEffect } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens } from "./adminUi";

export function AdminModal({
  open,
  onClose,
  title,
  theme,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  theme: BoardTheme;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = boardTokens(theme);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal
    >
      <div
        className={`w-full max-w-md rounded-xl border p-5 shadow-2xl ${t.surface}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-3 space-y-3">{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
