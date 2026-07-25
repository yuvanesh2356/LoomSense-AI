import { useEffect, useState } from "react";
import { getHeatmapStates, HeatmapStateSummary } from "../api";

/** Fetches the all-state demand summary once, used by both the Dashboard
 * preview grid and the full Demand Heatmap page. */
export function useHeatmapData() {
  const [states, setStates] = useState<HeatmapStateSummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeatmapStates().then((data) => {
      setStates(data);
      setLoading(false);
    });
  }, []);

  return { states, loading };
}