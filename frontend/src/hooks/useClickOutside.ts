import { useEffect, RefObject } from "react";

/**
 * Calls `onOutsideClick` when a pointer event occurs outside `ref`'s element.
 * Used for the Topbar's search, notification, language, and profile dropdowns.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  onOutsideClick: () => void,
  active: boolean = true
) {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, onOutsideClick, active]);
}
