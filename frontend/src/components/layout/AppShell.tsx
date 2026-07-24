import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useSidebarState } from "../../hooks/useSidebarState";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { COLORS } from "../../design-system/brand";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Wraps every authenticated page with the sidebar + topbar shell and
 * animates content transitions between routes. Page components themselves
 * (Dashboard, Forecast, Income, ...) are unchanged — only what surrounds
 * them is new.
 */
export default function AppShell({ children }: AppShellProps) {
  const { collapsed, toggle } = useSidebarState();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: COLORS.ivory }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggle} />
      )}

      {/* Mobile drawer sidebar */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50"
            >
              <Sidebar
                collapsed={false}
                onToggleCollapsed={() => {}}
                isDrawer
                onCloseDrawer={() => setDrawerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileDrawer={() => setDrawerOpen(true)} isMobile={isMobile} />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="max-w-6xl mx-auto px-6 py-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
