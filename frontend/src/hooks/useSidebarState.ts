import { useEffect, useState } from "react";

const STORAGE_KEY = "vastrayan_sidebar_collapsed";

/**
 * Persists sidebar collapsed/expanded state across sessions so the layout
 * doesn't "flash" back to a default state on every reload.
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage unavailable (e.g. private browsing) — fail silently
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((prev) => !prev);

  return { collapsed, setCollapsed, toggle };
}
