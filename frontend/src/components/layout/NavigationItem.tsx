import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { NavItem } from "../../config/navigation";
import { COLORS } from "../../design-system/brand";

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

/**
 * Single sidebar entry. The active background is a shared `layoutId` so
 * framer-motion animates it sliding between items on navigation, instead of
 * abruptly appearing — the "Linear-style" active indicator.
 */
const NavigationItem = React.forwardRef<HTMLAnchorElement, NavigationItemProps>(
  ({ item, isActive, collapsed, onNavigate }, ref) => {
    const Icon = item.icon;

    return (
      <Link
        ref={ref}
        to={item.path}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 mx-2 outline-none focus-visible:ring-2 active:scale-[0.98] transition-transform"
        
        style={{ ["--tw-ring-color" as any]: COLORS.gold }}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: COLORS.emeraldDeep }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}

        <Icon
          size={19}
          className="relative z-10 shrink-0 transition-colors"
          style={{ color: isActive ? COLORS.warmWhite : COLORS.charcoalText, opacity: isActive ? 1 : 0.75 }}
        />

        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: isActive ? COLORS.warmWhite : COLORS.charcoalText }}
          >
            {item.label}
          </motion.span>
        )}

        {!isActive && (
          <span
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ backgroundColor: `${COLORS.emeraldBright}14` }}
          />
        )}
      </Link>
    );
  }
);

NavigationItem.displayName = "NavigationItem";
export default NavigationItem;
