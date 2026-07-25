import React from "react";
import { motion } from "framer-motion";
import type { HeatmapStateSummary } from "../../api";
import { COLORS } from "../../design-system/brand";

interface StateHeatmapGridProps {
  states: HeatmapStateSummary[];
  selectedCode?: string | null;
  onSelectState: (stateCode: string) => void;
  /** Dashboard preview mode: fewer tiles, denser grid. */
  compact?: boolean;
}

function demandColor(index: number): string {
  if (index >= 70) return COLORS.emeraldDeep;
  if (index >= 45) return COLORS.gold;
  return "#B9C2B4"; // muted sage for low demand — stays on-brand, not alarming
}

function demandLabel(index: number): string {
  if (index >= 70) return "High";
  if (index >= 45) return "Medium";
  return "Low";
}

/**
 * Simplified, non-geographic demand heatmap: a responsive grid of state
 * tiles color-coded by demand index. Chosen deliberately over a geographic
 * SVG choropleth (which would need react-simple-maps + an external
 * topojson/geojson fetched at runtime) to keep this 100% offline/demo-safe
 * with no third-party map-file dependency. A real choropleth can be
 * swapped in later behind the same `onSelectState(stateCode)` contract
 * without touching any other file.
 */
export default function StateHeatmapGrid({
  states, selectedCode, onSelectState, compact,
}: StateHeatmapGridProps) {
  const displayStates = compact ? states.slice(0, 6) : states;

  return (
    <div
      className={`grid gap-3 ${
        compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      }`}
    >
      {displayStates.map((s) => {
        const isSelected = s.state_code === selectedCode;
        return (
          <motion.button
            key={s.state_code}
            onClick={() => onSelectState(s.state_code)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-xl p-3 text-left border-2 transition-colors"
            style={{
              backgroundColor: `${demandColor(s.demand_index)}1A`,
              borderColor: isSelected ? COLORS.emeraldDeep : "transparent",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: demandColor(s.demand_index) }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: COLORS.charcoalText, opacity: 0.6 }}
              >
                {s.growth_pct >= 0 ? "+" : ""}
                {s.growth_pct}%
              </span>
            </div>
            <p className="text-sm font-semibold truncate" style={{ color: COLORS.emeraldDeep }}>
              {s.state_name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
              {demandLabel(s.demand_index)} demand
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}