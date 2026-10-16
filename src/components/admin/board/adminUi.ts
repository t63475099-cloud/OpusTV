export type BoardTheme = "dark" | "light";

export function boardTokens(theme: BoardTheme) {
  const dark = theme === "dark";
  return {
    dark,
    page: dark ? "bg-[#0B0F19] text-[#F8FAFC]" : "bg-[#F8FAFC] text-[#0F172A]",
    surface: dark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200",
    input: dark
      ? "bg-[#0B0F19] border-slate-700 text-[#F8FAFC] placeholder:text-slate-500"
      : "bg-white border-slate-200 text-[#0F172A] placeholder:text-slate-400",
    muted: dark ? "text-slate-400" : "text-slate-600",
    border: dark ? "border-slate-800" : "border-slate-200",
    rowHover: dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50",
    tabActive: dark
      ? "bg-violet-600 text-white"
      : "bg-violet-600 text-white",
    tabIdle: dark
      ? "bg-[#111827] text-slate-300 hover:bg-slate-800"
      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200",
  };
}

export const btn = {
  coins: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25",
  verify: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/40 hover:bg-sky-500/25",
  pass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/40 hover:bg-violet-500/25",
  ban: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 hover:bg-rose-500/25",
  ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25",
  ghost: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
  primary: "bg-violet-600 text-white hover:bg-violet-500",
  compact: "text-xs py-1 px-2.5 rounded-md font-medium transition",
};
