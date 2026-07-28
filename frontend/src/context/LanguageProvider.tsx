import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../i18n";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "../config/languages";
import { useAuth } from "../App";
import { updateMe } from "../api";

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

/**
 * Phase 12: single global source of truth for the app's current
 * language. Every consumer (Topbar dropdown, AI Assistant, future
 * Settings Language tab) reads/writes here — no page manages its own
 * language state anymore.
 *
 * Persistence strategy:
 * - localStorage gives an instant, synchronous restore on reload (see
 *   src/i18n/index.ts, which reads it before first render).
 * - Once the authenticated user's profile loads (`me.preferred_language`
 *   from Batch 1's GET /api/me), that value reconciles local state if it
 *   differs — e.g. the user changed language on a different device.
 * - Every explicit user-initiated change calls `updateMe()` (Batch 1's
 *   PATCH /api/me) to persist the choice server-side. This does not
 *   require Firebase — it already works against the existing demo auth,
 *   and needs zero changes when Firebase lands in Phase 13, since
 *   updateMe() is already auth-derived (no ID in the URL).
 *
 * This provider must be rendered inside AuthProvider (it calls useAuth()),
 * per the tree in App.tsx.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const [language, setLanguageState] = useState<string>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("ls_language") : null;
    return stored && isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  });

  // Reconcile with the backend's preferred_language once the profile loads
  // (e.g. after login, or after a refresh once auth resolves).
  useEffect(() => {
    if (me?.preferred_language && isSupportedLanguage(me.preferred_language) && me.preferred_language !== language) {
      setLanguageState(me.preferred_language);
      i18n.changeLanguage(me.preferred_language);
      localStorage.setItem("ls_language", me.preferred_language);
    }
    // Intentionally only reacts to `me` changing (e.g. login/refresh),
    // not to `language` itself, to avoid fighting a user's in-session change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const setLanguage = (code: string) => {
    if (!isSupportedLanguage(code)) return;
    setLanguageState(code);
    i18n.changeLanguage(code);
    localStorage.setItem("ls_language", code);
    // Best-effort persistence — if this fails (e.g. offline), the choice
    // still applies for the current session via localStorage.
    updateMe({ preferred_language: code }).catch(() => {});
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}