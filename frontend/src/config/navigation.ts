import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Sparkles,
  ClipboardList, FileText, Landmark, Settings, HelpCircle, Bot, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  description?: string;
  phaseLabel?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Demand Forecast", path: "/forecast", icon: TrendingUp },
  { label: "Income Prediction", path: "/income", icon: Wallet },
  { label: "Market Trends", path: "/market-trends", icon: BarChart3 },
  // Phase 5+6: Production Planner and AI Assistant are now real pages.
  { label: "Production Planner", path: "/production-planner", icon: ClipboardList },
  { label: "AI Assistant", path: "/ai-assistant", icon: Bot },
  {
    label: "Smart Recommendations", path: "/recommendations", icon: Sparkles, comingSoon: true,
    description: "\u201cWhat should I weave next?\u201d recommendations tailored to region, raw material, budget, and time available.",
    phaseLabel: "Arriving in Phase 9/10 — AI Recommender",
  },
  {
    label: "Reports", path: "/reports", icon: FileText, comingSoon: true,
    description: "Exportable forecast accuracy, profit, and seasonality reports for your records or cooperative sharing.",
    phaseLabel: "Arriving in Phase 9/10 — Analytics Suite",
  },
  {
    label: "Government Schemes", path: "/government-schemes", icon: Landmark, comingSoon: true,
    description: "Profile-based matching against PM Vishwakarma, Mudra loans, state schemes, insurance, and training programs.",
    phaseLabel: "Arriving in Phase 7+8 — Scheme Advisor",
  },
];

export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: "Settings", path: "/settings", icon: Settings, comingSoon: true,
    description: "Manage your profile, language, and notification preferences.",
    phaseLabel: "Arriving in final polish phase",
  },
  {
    label: "Help", path: "/help", icon: HelpCircle, comingSoon: true,
    description: "Guides, FAQs, and support contacts for using the platform.",
    phaseLabel: "Arriving in final polish phase",
  },
];

const ALL_ITEMS = [...NAV_ITEMS, ...UTILITY_NAV_ITEMS];

export function getPageTitle(pathname: string): string {
  const match = ALL_ITEMS.find((item) => item.path === pathname);
  return match?.label ?? "Vastrayan";
}