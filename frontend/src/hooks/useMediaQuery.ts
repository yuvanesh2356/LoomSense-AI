import { useEffect, useState } from "react";

/** Returns whether the given media query currently matches, updating on resize. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Convenience preset matching Tailwind's `md` breakpoint (mobile drawer threshold). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
