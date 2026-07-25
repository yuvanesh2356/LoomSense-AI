import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Sparkles,
  ClipboardList, FileText, Landmark, Settings, HelpCircle, Bot,
  PartyPopper, ShoppingBag, type LucideIcon,
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
  { label: "Production Planner", path: "/production-planner", icon: ClipboardList },
  { label: "AI Assistant", path: "/ai-assistant", icon: Bot },
  // Phase 7: real pages now
  { label: "Festival Predictor", path: "/festival-predictor", icon: PartyPopper },
  { label: "Marketplace", path: "/marketplace", icon: ShoppingBag },
  // Phase 8: real page now
  { label: "Government Schemes", path: "/government-schemes", icon: Landmark },
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