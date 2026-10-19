"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/settings";
import { t } from "@/lib/i18n/messages";
import {
  applyLocale,
  readLocale,
  type LocaleCode,
} from "@/lib/themeLocale";
import { isLocaleCode } from "@/lib/i18n/types";

function normalizeLocale(v: string | undefined | null): LocaleCode {
  if (v && isLocaleCode(v)) return v;
  return "vi";
}

/** Reactive i18n: settings.language + data-locale + storage events */
export function useI18n() {
  const settingsLang = useSettingsStore((s) => s.settings.language);
  const [locale, setLocale] = useState<LocaleCode>(() =>
    normalizeLocale(settingsLang || (typeof window !== "undefined" ? readLocale() : "vi"))
  );

  useEffect(() => {
    const next = normalizeLocale(settingsLang);
    setLocale(next);
    applyLocale(next);
  }, [settingsLang]);

  useEffect(() => {
    const onLocale = (e: Event) => {
      const detail = (e as CustomEvent).detail as { locale?: string } | undefined;
      if (detail?.locale && isLocaleCode(detail.locale)) {
        setLocale(detail.locale);
      } else {
        setLocale(normalizeLocale(readLocale()));
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "opus_locale" || e.key === "opusfilm-settings") {
        setLocale(normalizeLocale(readLocale() || useSettingsStore.getState().settings.language));
      }
    };
    window.addEventListener("opus-locale-change", onLocale);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("opus-locale-change", onLocale);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const translate = useCallback(
    (key: string) => t(locale, key),
    [locale]
  );

  return { locale, t: translate };
}

export function setAppLanguage(locale: LocaleCode) {
  applyLocale(locale);
  try {
    useSettingsStore.getState().updateSettings({ language: locale });
  } catch {
    /* */
  }
  try {
    window.dispatchEvent(new CustomEvent("opus-locale-change", { detail: { locale } }));
  } catch {
    /* */
  }
}
