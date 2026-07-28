/**
 * Phase 12: single centralized list of supported languages. Every
 * consumer — Topbar dropdown, Settings' Language tab (Batch 3), i18n
 * initialization, backend validation — reads from this one file. Adding
 * a language later is: one entry here + one translation resource set
 * (see src/i18n/locales/) + nothing else.
 */
export interface SupportedLanguage {
  code: string;
  label: string;       // English name, shown as a fallback/secondary label
  nativeLabel: string; // Name in the language's own script
  fontStack?: string;  // Reserved for Phase 12 Batch 3+ regional font loading
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", nativeLabel: "English", fontStack: "Inter" },
  { code: "hi", label: "Hindi", nativeLabel: "\u0939\u093f\u0902\u0926\u0940", fontStack: "Noto Sans Devanagari" },
  { code: "ta", label: "Tamil", nativeLabel: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd", fontStack: "Noto Sans Tamil" },
];

export const DEFAULT_LANGUAGE = "en";

export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}