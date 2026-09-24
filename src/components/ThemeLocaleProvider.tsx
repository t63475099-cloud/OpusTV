"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyLocale,
  applyTheme,
  LOCALE_KEY,
  readLocale,
  readTheme,
  resolveTheme,
  THEME_KEY,
  translate,
  type LocaleCode,
  type ThemeMode,
} from "@/lib/themeLocale";

type Ctx = {
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  locale: LocaleCode;
  setTheme: (m: ThemeMode) => void;
  setLocale: (l: LocaleCode) => void;
  t: (key: string) => string;
};

const ThemeLocaleCtx = createContext<Ctx | null>(null);

export function ThemeLocaleProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [locale, setLocaleState] = useState<LocaleCode>("vi");
  const [resolvedTheme, setResolved] = useState<"dark" | "light">("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const th = readTheme();
    const loc = readLocale();
    setThemeState(th);
    setLocaleState(loc);
    applyTheme(th);
    applyLocale(loc);
    setResolved(resolveTheme(th));
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && e.newValue) {
        const m = e.newValue as ThemeMode;
        if (m === "dark" || m === "light" || m === "system") {
          setThemeState(m);
          applyTheme(m);
          setResolved(resolveTheme(m));
        }
      }
      if (e.key === LOCALE_KEY && e.newValue) {
        const l = e.newValue as LocaleCode;
        if (l === "vi" || l === "en") {
          setLocaleState(l);
          applyLocale(l);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      const cur = readTheme();
      if (cur === "system") {
        applyTheme("system");
        setResolved(resolveTheme("system"));
      }
    };
    mq.addEventListener?.("change", onScheme);

    return () => {
      window.removeEventListener("storage", onStorage);
      mq.removeEventListener?.("change", onScheme);
    };
  }, []);

  const setTheme = useCallback((m: ThemeMode) => {
    setThemeState(m);
    applyTheme(m);
    setResolved(resolveTheme(m));
  }, []);

  const setLocale = useCallback((l: LocaleCode) => {
    setLocaleState(l);
    applyLocale(l);
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, locale, setTheme, setLocale, t }),
    [theme, resolvedTheme, locale, setTheme, setLocale, t]
  );

  return (
    <ThemeLocaleCtx.Provider value={value}>
      <div
        className={ready ? "contents" : "contents"}
        data-theme-ready={ready ? "1" : "0"}
      >
        {children}
      </div>
    </ThemeLocaleCtx.Provider>
  );
}

export function useThemeLocale() {
  const ctx = useContext(ThemeLocaleCtx);
  if (!ctx) {
    return {
      theme: "dark" as ThemeMode,
      resolvedTheme: "dark" as const,
      locale: "vi" as LocaleCode,
      setTheme: (_: ThemeMode) => {},
      setLocale: (_: LocaleCode) => {},
      t: (key: string) => translate("vi", key),
    };
  }
  return ctx;
}
