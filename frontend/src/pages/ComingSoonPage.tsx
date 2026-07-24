import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { COLORS } from "../design-system/brand";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phaseLabel: string;
}

/**
 * Consistent, polished placeholder for sidebar destinations whose full
 * module lands in a later phase (Market Trends, Smart Recommendations,
 * Production Planner, Reports, Government Schemes, Settings, Help).
 * Keeps every sidebar link "live" and on-brand rather than 404-ing or
 * looking unfinished, without pretending the feature already works.
 */
export default function ComingSoonPage({ title, description, icon: Icon, phaseLabel }: ComingSoonPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center text-center py-20"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: `${COLORS.emeraldDeep}12` }}
      >
        <Icon size={28} style={{ color: COLORS.emeraldDeep }} />
      </div>
      <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: COLORS.emeraldDeep }}>
        {title}
      </h1>
      <p className="text-sm max-w-md mb-4" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
        {description}
      </p>
      <span
        className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
        style={{ backgroundColor: `${COLORS.gold}22`, color: COLORS.emeraldDeep }}
      >
        {phaseLabel}
      </span>
    </motion.div>
  );
}
