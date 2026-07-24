import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { getPageTitle } from "../../config/navigation";
import { COLORS } from "../../design-system/brand";

/**
 * Simple two-level breadcrumb: "App > Current Page". Kept intentionally
 * shallow since the navigation is flat (no nested sub-routes yet) — the
 * component is written to extend to deeper trails once modules like
 * Government Schemes grow sub-pages.
 */
export default function Breadcrumb() {
  const location = useLocation();
  const currentTitle = getPageTitle(location.pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 hover:underline"
        style={{ color: COLORS.charcoalText, opacity: 0.6 }}
      >
        <Home size={14} />
        <span>Vastrayan</span>
      </Link>
      <ChevronRight size={14} style={{ color: COLORS.charcoalText, opacity: 0.35 }} />
      <span className="font-medium" style={{ color: COLORS.emeraldDeep }}>
        {currentTitle}
      </span>
    </nav>
  );
}
