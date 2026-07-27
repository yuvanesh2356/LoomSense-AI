import React, { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "../App";
import {
  getDashboardSummary, getIncomeCalendar, getStabilityScore, getForecast,
  getHeatmapStateDetail, HeatmapStateDetail,
} from "../api";
import { useHeatmapData } from "../hooks/useHeatmapData";
import { useAsync } from "../hooks/useAsync";
import StateHeatmapGrid from "../components/charts/StateHeatmapGrid";
import { DashboardSkeleton, ErrorState, EmptyState } from "../components/feedback";
import { COLORS } from "../design-system/brand";

function MetricCard({
  label, value, sublabel, accent, small,
}: { label: string; value: string | number; sublabel?: string; accent: string; small?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border p-4 transition-shadow hover:shadow-md"
      style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
    >
      <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>
        {label}
      </p>
      <p
        className={small ? "text-base font-bold mt-1 truncate" : "text-2xl font-bold mt-1"}
        style={{ color: accent, fontFamily: small ? undefined : "'Fraunces', Cambria, serif" }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs mt-1 truncate" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>
          {sublabel}
        </p>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { me } = useAuth();
  const weaverId = me?.weaver.id;

  const { data, loading, error, reload } = useAsync(async () => {
    if (!weaverId) throw new Error("Not signed in");
    const [summary, income, stability, forecast] = await Promise.all([
      getDashboardSummary(weaverId),
      getIncomeCalendar(weaverId),
      getStabilityScore(weaverId),
      getForecast(weaverId),
    ]);
    return { summary, income, stability, forecast };
  }, [weaverId]);

  const { states } = useHeatmapData();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [stateDetail, setStateDetail] = useState<HeatmapStateDetail | null>(null);

  function handleSelectState(code: string) {
    setSelectedCode(code);
    getHeatmapStateDetail(code).then(setStateDetail);
  }

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Nothing to show yet"
        description="Once you have a forecast and income history, your dashboard will populate here."
      />
    );
  }

  const { summary, income, stability, forecast } = data;

  const incomeChartData = income.months.map((m) => ({
    month: m.month.slice(5),
    projected: m.projected,
    actual: m.actual ?? null,
  }));

  const demandCurve = incomeChartData.map((d) => ({ month: d.month, demand: Math.round(d.projected / 100) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Welcome back, {me?.weaver.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          {me?.weaver.cluster} cluster &middot; {me?.weaver.product_category}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard
          label="Today's Demand"
          value={summary.today_demand.demand_index}
          sublabel={`${summary.today_demand.label} \u00b7 ${summary.today_demand.driver}`}
          accent={COLORS.emeraldDeep}
        />
        <MetricCard
          label="Estimated Income"
          value={summary.estimated_income != null ? `\u20b9${Math.round(summary.estimated_income).toLocaleString("en-IN")}` : "\u2014"}
          sublabel="this month, projected"
          accent={COLORS.gold}
        />
        <MetricCard
          label="Forecast Accuracy"
          value={`${summary.forecast_accuracy.accuracy_pct}%`}
          sublabel={`${summary.forecast_accuracy.sample_size} outcomes logged`}
          accent={COLORS.emeraldBright}
        />
        <MetricCard
          label="Market Trend"
          value={`${summary.market_trend.growth_pct >= 0 ? "+" : ""}${summary.market_trend.growth_pct}%`}
          sublabel={`${summary.market_trend.state_name} cluster growth`}
          accent={summary.market_trend.growth_pct >= 0 ? COLORS.emeraldDeep : "#A63A50"}
        />
        <MetricCard
          label="Recommended Product"
          value={summary.recommended_product}
          sublabel="from your latest forecast"
          accent={COLORS.emeraldDeep}
          small
        />
        <MetricCard
          label="Inventory Status"
          value={summary.inventory_status}
          sublabel="vs. weekly loom capacity"
          accent={summary.inventory_status === "Tight" ? "#A63A50" : COLORS.emeraldBright}
          small
        />
        <MetricCard
          label="Production Capacity"
          value={`${summary.production_capacity}/wk`}
          sublabel="units per week"
          accent={COLORS.gold}
        />
      </div>

      <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold" style={{ color: COLORS.emeraldDeep }}>
              State-wise Demand
            </h3>
            <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
              Tap a state for its demand snapshot, or open the full heatmap for festivals & pricing.
            </p>
          </div>
          <Link
            to="/market-trends"
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-transform hover:scale-105"
            style={{ backgroundColor: `${COLORS.emeraldDeep}12`, color: COLORS.emeraldDeep }}
          >
            Open full heatmap &rarr;
          </Link>
        </div>

        {states && (
          <StateHeatmapGrid states={states} selectedCode={selectedCode} onSelectState={handleSelectState} compact />
        )}

        {stateDetail && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t text-sm"
            style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText }}
          >
            <span className="font-semibold" style={{ color: COLORS.emeraldDeep }}>{stateDetail.state_name}: </span>
            demand index {stateDetail.demand_index}/100, {stateDetail.growth_pct >= 0 ? "+" : ""}
            {stateDetail.growth_pct}% growth &middot; top product: {stateDetail.top_products[0]}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6 transition-shadow hover:shadow-md" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-1" style={{ color: COLORS.emeraldDeep }}>Demand Trend</h3>
          <p className="text-xs mb-3" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Relative demand index across your rolling calendar.</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={demandCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="month" stroke={COLORS.charcoalText} fontSize={11} />
              <YAxis stroke={COLORS.charcoalText} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }} />
              <Line type="monotone" dataKey="demand" stroke={COLORS.gold} strokeWidth={2.5} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6 transition-shadow hover:shadow-md" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-1" style={{ color: COLORS.emeraldDeep }}>Income Trend</h3>
          <p className="text-xs mb-3" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Projected vs. actual monthly income.</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={incomeChartData}>
              <defs>
                <linearGradient id="proj2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.emeraldDeep} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.emeraldDeep} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="month" stroke={COLORS.charcoalText} fontSize={11} />
              <YAxis stroke={COLORS.charcoalText} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }} formatter={(v: number) => [`\u20b9${v.toLocaleString("en-IN")}`, ""]} />
              <Area type="monotone" dataKey="projected" stroke={COLORS.emeraldDeep} fill="url(#proj2)" strokeWidth={2} isAnimationActive />
              <Area type="monotone" dataKey="actual" stroke={COLORS.gold} fill="none" strokeWidth={2} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6 transition-shadow hover:shadow-md" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-1" style={{ color: COLORS.emeraldDeep }}>Seasonality</h3>
          <p className="text-xs mb-3" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Which months naturally run higher for your category.</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="month" stroke={COLORS.charcoalText} fontSize={11} />
              <YAxis stroke={COLORS.charcoalText} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }} />
              <Bar dataKey="projected" fill={COLORS.gold} radius={[6, 6, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.emeraldDeep, borderColor: COLORS.emeraldDeep }}>
          <h3 className="font-display text-base font-semibold mb-2" style={{ color: COLORS.gold }}>AI Insights</h3>
          <p className="text-sm leading-relaxed" style={{ color: "#EAF2ED" }}>{forecast.reason}</p>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: COLORS.gold }}>
              Stability score {stability.score}/100
            </span>
            <Link to="/forecast" className="text-xs font-semibold underline" style={{ color: "#EAF2ED" }}>
              View full explanation &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}