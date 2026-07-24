import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Sparkles,
  ClipboardList, FileText, Landmark, Settings, HelpCircle, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Pages not yet built in this phase render the shared ComingSoonPage. */
  comingSoon?: boolean;
  description?: string;
  phaseLabel?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Demand Forecast", path: "/forecast", icon: TrendingUp },
  { label: "Income Prediction", path: "/income", icon: Wallet },
  {
    label: "Market Trends", path: "/market-trends", icon: BarChart3, comingSoon: true,
    description: "Regional and category-level demand trends, price movements, and emerging micro-trends across handloom clusters.",
    phaseLabel: "Arriving in Phase 4 — Demand Heatmap",
  },
  {
    label: "Smart Recommendations", path: "/recommendations", icon: Sparkles, comingSoon: true,
    description: "\u201cWhat should I weave next?\u201d recommendations tailored to region, raw material, budget, and time available.",
    phaseLabel: "Arriving in Phase 10 — AI Recommender",
  },
  {
    label: "Production Planner", path: "/production-planner", icon: ClipboardList, comingSoon: true,
    description: "A visual, step-by-step plan from current inventory through forecast, raw material, labour, and expected profit.",
    phaseLabel: "Arriving in Phase 5 — Production Planner",
  },
  {
    label: "Reports", path: "/reports", icon: FileText, comingSoon: true,
    description: "Exportable forecast accuracy, profit, and seasonality reports for your records or cooperative sharing.",
    phaseLabel: "Arriving in Phase 10 — Analytics Suite",
  },
  {
    label: "Government Schemes", path: "/government-schemes", icon: Landmark, comingSoon: true,
    description: "Profile-based matching against PM Vishwakarma, Mudra loans, state schemes, insurance, and training programs.",
    phaseLabel: "Arriving in Phase 8 — Scheme Advisor",
  },
];

/** Shown separately at the bottom of the sidebar, same visual treatment. */
export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    label: "Settings", path: "/settings", icon: Settings, comingSoon: true,
    description: "Manage your profile, language, and notification preferences.",
    phaseLabel: "Arriving in Phase 11 — Polish Pass",
  },
  {
    label: "Help", path: "/help", icon: HelpCircle, comingSoon: true,
    description: "Guides, FAQs, and support contacts for using the platform.",
    phaseLabel: "Arriving in Phase 11 — Polish Pass",
  },
];

const ALL_ITEMS = [...NAV_ITEMS, ...UTILITY_NAV_ITEMS];

export function getPageTitle(pathname: string): string {
  const match = ALL_ITEMS.find((item) => item.path === pathname);
  return match?.label ?? "Vastrayan";
}
