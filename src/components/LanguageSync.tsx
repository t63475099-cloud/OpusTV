"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/settings";
import { applyDocumentLang } from "@/lib/i18n";

/** Đồng bộ language setting → <html lang> trên mọi trang */
export default function LanguageSync() {
  const language = useSettingsStore((s) => s.settings.language);

  useEffect(() => {
    applyDocumentLang(language || "vi");
  }, [language]);

  return null;
}
