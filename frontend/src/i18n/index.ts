import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "../config/languages";

import enCommon from "./locales/en/common.json";
import enAssistant from "./locales/en/assistant.json";
import hiCommon from "./locales/hi/common.json";
import hiAssistant from "./locales/hi/assistant.json";
import taCommon from "./locales/ta/common.json";
import taAssistant from "./locales/ta/assistant.json";

// Phase 12: read the persisted choice synchronously, before React ever
// renders, so there is no flash of the wrong language on reload. This
// mirrors (and will later be reconciled with) the backend's
// preferred_language field once the user's profile loads — see
// LanguageProvider, which is the actual single source of truth at
// runtime. This line only controls the very first paint.
const persistedLanguage = (typeof window !== "undefined" && localStorage.getItem("ls_language")) || DEFAULT_LANGUAGE;

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, assistant: enAssistant },
    hi: { common: hiCommon, assistant: hiAssistant },
    ta: { common: taCommon, assistant: taAssistant },
  },
  lng: persistedLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  ns: ["common", "assistant"],
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export default i18n;