import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Search, Bell, Sun, Moon, Globe, ChevronDown, Plus,
  TrendingUp, Wallet, LogOut, User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../App";
import { useClickOutside } from "../../hooks/useClickOutside";
import { COLORS } from "../../design-system/brand";
import Breadcrumb from "./Breadcrumb";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

const MOCK_ALERTS = [
  { title: "Festival demand rising", detail: "Ganesh Chaturthi lift detected for Pochampally cotton.", time: "2h ago" },
  { title: "Low-income month flagged", detail: "February projected below your safety threshold.", time: "1d ago" },
  { title: "Recommendation accepted", detail: "You accepted the Red/Gold Cotton Saree forecast.", time: "3d ago" },
];

interface TopbarProps {
  onOpenMobileDrawer: () => void;
  isMobile: boolean;
}

export default function Topbar({ onOpenMobileDrawer, isMobile }: TopbarProps) {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [openMenu, setOpenMenu] = useState<"lang" | "notif" | "profile" | "quick" | null>(null);

  const langRef = useRef<HTMLDivElement>(null!);
  const notifRef = useRef<HTMLDivElement>(null!);
  const profileRef = useRef<HTMLDivElement>(null!);
  const quickRef = useRef<HTMLDivElement>(null!);

  useClickOutside(langRef, () => setOpenMenu((m) => (m === "lang" ? null : m)));
  useClickOutside(notifRef, () => setOpenMenu((m) => (m === "notif" ? null : m)));
  useClickOutside(profileRef, () => setOpenMenu((m) => (m === "profile" ? null : m)));
  useClickOutside(quickRef, () => setOpenMenu((m) => (m === "quick" ? null : m)));

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

  function toggleDarkMode() {
    setDark((prev) => {
      const next = !prev;
      // Subtle warm-dark variant only — never a pure black cyber theme,
      // per the brand's design-system constraint.
      document.documentElement.style.setProperty(
        "--surface-base", next ? COLORS.darkGreen : COLORS.ivory
      );
      document.documentElement.classList.toggle("theme-dark", next);
      return next;
    });
  }

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 md:px-6 border-b shrink-0 relative z-20"
      style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
    >
      {isMobile && (
        <button onClick={onOpenMobileDrawer} className="p-2 rounded-lg hover:bg-black/5" aria-label="Open navigation">
          <Menu size={20} style={{ color: COLORS.emeraldDeep }} />
        </button>
      )}

      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md ml-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border"
          style={{ borderColor: "#EAE4D6", backgroundColor: COLORS.ivory }}
        >
          <Search size={16} style={{ color: COLORS.charcoalText, opacity: 0.5 }} />
          <input
            type="text"
            placeholder="Search forecasts, products, weavers..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
            style={{ color: COLORS.charcoalText }}
          />
          <kbd
            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border"
            style={{ borderColor: "#DCD5C4", color: COLORS.charcoalText, opacity: 0.5 }}
          >
            /
          </kbd>
        </div>
      </div>

      <div className="flex-1" />

      {/* Current date */}
      <span
        className="hidden lg:inline text-xs font-medium whitespace-nowrap"
        style={{ color: COLORS.charcoalText, opacity: 0.55 }}
      >
        {today}
      </span>

      {/* Quick actions */}
      <div className="relative" ref={quickRef}>
        <button
          onClick={() => setOpenMenu((m) => (m === "quick" ? null : "quick"))}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ backgroundColor: COLORS.emeraldDeep }}
        >
          <Plus size={15} /> <span className="hidden sm:inline">Quick Actions</span>
        </button>
        <AnimatePresence>
          {openMenu === "quick" && (
            <DropdownPanel>
              <DropdownAction icon={TrendingUp} label="View today's forecast" onClick={() => { navigate("/forecast"); setOpenMenu(null); }} />
              <DropdownAction icon={Wallet} label="Open income calendar" onClick={() => { navigate("/income"); setOpenMenu(null); }} />
            </DropdownPanel>
          )}
        </AnimatePresence>
      </div>

      {/* Language selector */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setOpenMenu((m) => (m === "lang" ? null : "lang"))}
          className="flex items-center gap-1 px-2.5 py-2 rounded-xl hover:bg-black/5 text-sm"
          style={{ color: COLORS.charcoalText }}
        >
          <Globe size={17} style={{ opacity: 0.65 }} />
          <span className="hidden sm:inline">{language.label}</span>
          <ChevronDown size={13} style={{ opacity: 0.5 }} />
        </button>
        <AnimatePresence>
          {openMenu === "lang" && (
            <DropdownPanel>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l); setOpenMenu(null); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-black/5"
                  style={{ color: l.code === language.code ? COLORS.emeraldDeep : COLORS.charcoalText, fontWeight: l.code === language.code ? 600 : 400 }}
                >
                  {l.label}
                </button>
              ))}
            </DropdownPanel>
          )}
        </AnimatePresence>
      </div>

      {/* Theme switch */}
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-xl hover:bg-black/5"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {dark ? <Sun size={18} style={{ color: COLORS.gold }} /> : <Moon size={18} style={{ color: COLORS.charcoalText, opacity: 0.65 }} />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setOpenMenu((m) => (m === "notif" ? null : "notif"))}
          className="relative p-2 rounded-xl hover:bg-black/5"
          aria-label="Notifications"
        >
          <Bell size={18} style={{ color: COLORS.charcoalText, opacity: 0.7 }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.gold }}
          />
        </button>
        <AnimatePresence>
          {openMenu === "notif" && (
            <DropdownPanel wide>
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
                Recent Alerts
              </p>
              {MOCK_ALERTS.map((a, i) => (
                <div key={i} className="px-3 py-2.5 rounded-lg hover:bg-black/5">
                  <p className="text-sm font-medium" style={{ color: COLORS.emeraldDeep }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>{a.detail}</p>
                  <p className="text-[10px] mt-1" style={{ color: COLORS.charcoalText, opacity: 0.4 }}>{a.time}</p>
                </div>
              ))}
            </DropdownPanel>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setOpenMenu((m) => (m === "profile" ? null : "profile"))}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-black/5"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: `${COLORS.gold}30`, color: COLORS.emeraldDeep }}
          >
            {me?.weaver.name?.slice(0, 1) ?? "?"}
          </div>
          <ChevronDown size={13} style={{ color: COLORS.charcoalText, opacity: 0.5 }} className="hidden sm:block" />
        </button>
        <AnimatePresence>
          {openMenu === "profile" && (
            <DropdownPanel align="right">
              <div className="px-3 pb-2">
                <p className="text-sm font-medium" style={{ color: COLORS.emeraldDeep }}>{me?.weaver.name}</p>
                <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>{me?.weaver.cluster}</p>
              </div>
              <DropdownAction icon={UserIcon} label="View profile" onClick={() => { navigate("/settings"); setOpenMenu(null); }} />
              <DropdownAction icon={LogOut} label="Log out" onClick={logout} danger />
            </DropdownPanel>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// --- Small local sub-components (kept in-file to avoid over-fragmentation) --

function DropdownPanel({
  children, wide, align = "left",
}: { children: React.ReactNode; wide?: boolean; align?: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`absolute top-full mt-2 ${align === "right" ? "right-0" : "left-0"} ${wide ? "w-80" : "w-56"} rounded-2xl border p-2 shadow-lg z-30`}
      style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
    >
      {children}
    </motion.div>
  );
}

function DropdownAction({
  icon: Icon, label, onClick, danger,
}: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm hover:bg-black/5"
      style={{ color: danger ? COLORS.legacyMadder : COLORS.charcoalText }}
    >
      <Icon size={15} style={{ opacity: 0.75 }} />
      {label}
    </button>
  );
}
