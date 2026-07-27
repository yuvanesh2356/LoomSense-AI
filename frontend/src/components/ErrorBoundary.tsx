import React from "react";
import { COLORS } from "../design-system/brand";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches uncaught render errors anywhere below it so one broken page
 * can't blank out the entire app (e.g. mid-demo). React error boundaries
 * must be class components — there is no hooks equivalent. */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center text-center px-4"
          style={{ backgroundColor: COLORS.ivory }}
        >
          <p className="font-display text-xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
            Something went wrong.
          </p>
          <p className="text-sm mt-2" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
            Please refresh the page. If this keeps happening, try signing in again.
          </p>
          <button
            onClick={() => window.location.assign("/")}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: COLORS.emeraldDeep }}
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}