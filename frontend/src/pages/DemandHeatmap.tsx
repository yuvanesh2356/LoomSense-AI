import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeatmapData } from "../hooks/useHeatmapData";
import { getHeatmapStateDetail, HeatmapStateDetail } from "../api";
import StateHeatmapGrid from "../components/charts/StateHeatmapGrid";
import { COLORS } from "../design-system/brand";

export default function DemandHeatmap() {
  const { states, loading } = useHeatmapData();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<HeatmapStateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!states || states.length === 0 || selectedCode) return;
    setSelectedCode(states[0].state_code);
  }, [states, selectedCode]);

  useEffect(() => {
    if (!selectedCode) return;
    setDetailLoading(true);
    getHeatmapStateDetail(selectedCode).then((d) => {
      setDetail(d);
      setDetailLoading(false);
    });
  }, [selectedCode]);

  if (loading || !states) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Loading demand heatmap...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Demand Heatmap
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Regional demand across handloom clusters. Select a state for expected demand,
          growth, festivals, and price trend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StateHeatmapGrid states={states} selectedCode={selectedCode} onSelectState={setSelectedCode} />
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
        >
          <AnimatePresence mode="wait">
            {detailLoading || !detail ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm"
                style={{ color: COLORS.charcoalText, opacity: 0.5 }}
              >
                Loading state detail...
              </motion.div>
            ) : (
              <motion.div
                key={detail.state_code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
                  {detail.state_name}
                </h2>
                <div className="flex items-center gap-3 mt-2 mb-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${COLORS.emeraldDeep}12`, color: COLORS.emeraldDeep }}
                  >
                    Demand index {detail.demand_index}/100
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: detail.growth_pct >= 0 ? COLORS.emeraldDeep : "#A63A50" }}
                  >
                    {detail.growth_pct >= 0 ? "+" : ""}
                    {detail.growth_pct}% growth
                  </span>
                </div>

                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: COLORS.charcoalText, opacity: 0.5 }}
                >
                  Most demanded products
                </p>
                <ul className="space-y-1.5 mb-4">
                  {detail.top_products.map((p) => (
                    <li key={p} className="text-sm" style={{ color: COLORS.charcoalText }}>
                      &bull; {p}
                    </li>
                  ))}
                </ul>

                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: COLORS.charcoalText, opacity: 0.5 }}
                >
                  Upcoming festivals driving demand
                </p>
                <ul className="space-y-1.5 mb-4">
                  {detail.festivals.map((fest) => (
                    <li key={fest} className="text-sm" style={{ color: COLORS.charcoalText }}>
                      &bull; {fest}
                    </li>
                  ))}
                </ul>

                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: COLORS.charcoalText, opacity: 0.5 }}
                >
                  Price trend
                </p>
                <p className="text-sm capitalize" style={{ color: COLORS.charcoalText }}>
                  {detail.price_trend}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}