import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { NAV_ITEMS, UTILITY_NAV_ITEMS } from "../../config/navigation";
import { APP_NAME, COLORS } from "../../design-system/brand";
import { useAuth } from "../../App";
import NavigationItem from "./NavigationItem";

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile drawer mode: sidebar renders as a fixed overlay, closes on navigate. */
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapsed, isDrawer, onCloseDrawer }: SidebarProps) {
  const location = useLocation();
  const { me, logout } = useAuth();
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Visually expanded either because the sidebar isn't collapsed, or the
  // user is hovering a collapsed sidebar (Linear-style "peek" expand).
  const visuallyCollapsed = collapsed && !hoverExpanded && !isDrawer;
  const width = visuallyCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const allItems = [...NAV_ITEMS, ...UTILITY_NAV_ITEMS];

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(index + 1) % allItems.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(index - 1 + allItems.length) % allItems.length]?.focus();
    }
  }

  return (
    <motion.aside
      role="navigation"
      aria-label="Primary"
      onMouseEnter={() => !isDrawer && collapsed && setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
      animate={{ width }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="h-full flex flex-col border-r overflow-hidden"
      style={{
        backgroundColor: COLORS.warmWhite,
        borderColor: "#EAE4D6",
        width: isDrawer ? EXPANDED_WIDTH : undefined,
      }}
    >
      {/* Brand mark */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b" style={{ borderColor: "#EAE4D6" }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-display font-bold text-sm"
          style={{ backgroundColor: COLORS.emeraldDeep, color: COLORS.gold }}
        >
          V
        </div>
        <AnimatePresence>
          {!visuallyCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display font-semibold text-base whitespace-nowrap"
              style={{ color: COLORS.emeraldDeep }}
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <div key={item.path} onKeyDown={(e) => handleKeyDown(e, i)}>
            <NavigationItem
              ref={(el) => (itemRefs.current[i] = el)}
              item={item}
              isActive={location.pathname === item.path}
              collapsed={visuallyCollapsed}
              onNavigate={isDrawer ? onCloseDrawer : undefined}
            />
          </div>
        ))}
      </nav>

      {/* Utility nav (Settings / Help) */}
      <div className="py-2 border-t space-y-0.5" style={{ borderColor: "#EAE4D6" }}>
        {UTILITY_NAV_ITEMS.map((item, i) => {
          const idx = NAV_ITEMS.length + i;
          return (
            <div key={item.path} onKeyDown={(e) => handleKeyDown(e, idx)}>
              <NavigationItem
                ref={(el) => (itemRefs.current[idx] = el)}
                item={item}
                isActive={location.pathname === item.path}
                collapsed={visuallyCollapsed}
                onNavigate={isDrawer ? onCloseDrawer : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom: profile + logout + version */}
      <div className="p-3 border-t flex items-center gap-3" style={{ borderColor: "#EAE4D6" }}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
          style={{ backgroundColor: `${COLORS.gold}30`, color: COLORS.emeraldDeep }}
        >
          {me?.weaver.name?.slice(0, 1) ?? "?"}
        </div>
        {!visuallyCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: COLORS.charcoalText }}>
              {me?.weaver.name ?? "Guest"}
            </p>
            <p className="text-xs truncate" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>
              v1.0.0 &middot; Phase 2
            </p>
          </div>
        )}
        <button
          onClick={logout}
          title="Log out"
          className="p-2 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <LogOut size={17} style={{ color: COLORS.charcoalText, opacity: 0.6 }} />
        </button>
      </div>

      {/* Collapse toggle (hidden in mobile drawer mode) */}
      {!isDrawer && (
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center gap-2 h-11 border-t text-xs font-medium hover:bg-black/5 transition-colors"
          style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText, opacity: 0.7 }}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!visuallyCollapsed && <span>Collapse</span>}
        </button>
      )}
    </motion.aside>
  );
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH };
