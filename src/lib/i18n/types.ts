export type LocaleCode =
  | "vi"
  | "en"
  | "zh"
  | "ko"
  | "ja"
  | "th"
  | "fr"
  | "es"
  | "id"
  | "pt";

export const LOCALE_LIST: { value: LocaleCode; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
  { value: "th", label: "ไทย" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "id", label: "Indonesia" },
  { value: "pt", label: "Português" },
];

export function isLocaleCode(v: string): v is LocaleCode {
  return LOCALE_LIST.some((x) => x.value === v);
}
