import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Sparkles,
  ClipboardList, Landmark, Settings, HelpCircle, Bot,
  PartyPopper, ShoppingBag, Boxes, Bell, BookOpen, Users, LineChart, ScanLine,
  type LucideIcon,
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
  { label: "Festival Predictor", path: "/festival-predictor", icon: PartyPopper },
  { label: "Marketplace", path: "/marketplace", icon: ShoppingBag },
  { label: "Government Schemes", path: "/government-schemes", icon: Landmark },
  // Phase 9
  { label: "Inventory", path: "/inventory", icon: Boxes },
  { label: "Smart Alerts", path: "/alerts", icon: Bell },
  { label: "Learning Hub", path: "/learning-hub", icon: BookOpen },
  { label: "Community", path: "/community", icon: Users },
  // Phase 10
  { label: "Analytics", path: "/analytics", icon: LineChart },
  { label: "Fabric Recognition", path: "/fabric-recognition", icon: ScanLine },
  { label: "What Should I Weave?", path: "/what-to-weave", icon: Sparkles },
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