import { useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Standardized data-fetching hook: consistent loading/error/data shape,
 * guards against setting state after unmount (avoids the classic "state
 * update on unmounted component" warning + wasted re-renders when a user
 * navigates away before a slow request resolves), and exposes `reload()`
 * so ErrorState's "Try again" button has something concrete to call.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: React.DependencyList): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const mountedRef = useRef(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (!cancelled && mountedRef.current) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setState({ data: null, loading: false, error: err?.response?.data?.error?.message || err?.message || "Failed to load." });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { ...state, reload: () => setReloadKey((k) => k + 1) };
}