import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useAuth } from "../App";
import { getAnalyticsSummary, AnalyticsSummary } from "../api";
import { COLORS } from "../design-system/brand";

export default function Analytics() {
  const { me } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getAnalyticsSummary(me.weaver.id).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [me]);

  if (loading || !data) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Crunching your analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Analytics Suite
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Forecast accuracy, profit, seasonality, state/product comparison, and risk \u2014 all in one view.
        </p>
      </div>

      <div className="rounded-2xl border p-5" style={{ backgroundColor: `${COLORS.emeraldDeep}08`, borderColor: `${COLORS.emeraldDeep}30` }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', serif" }}>{data.risk_analysis.overall_risk_score}</p>
            <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Overall risk score</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', serif" }}>{data.risk_analysis.component_breakdown.income_volatility_risk}</p>
            <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Income volatility risk</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', serif" }}>{data.risk_analysis.component_breakdown.market_risk}</p>
            <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Market risk</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: COLORS.emeraldDeep }}>Forecast Accuracy Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.forecast_accuracy_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="month" fontSize={11} stroke={COLORS.charcoalText} />
              <YAxis fontSize={11} stroke={COLORS.charcoalText} />
              <Tooltip />
              <Line type="monotone" dataKey="accuracy_pct" stroke={COLORS.emeraldDeep} strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: COLORS.emeraldDeep }}>Profit Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.profit_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="month" fontSize={11} stroke={COLORS.charcoalText} />
              <YAxis fontSize={11} stroke={COLORS.charcoalText} />
              <Tooltip />
              <Line type="monotone" dataKey="projected_profit" stroke={COLORS.gold} strokeWidth={2} />
              <Line type="monotone" dataKey="actual_profit" stroke={COLORS.emeraldDeep} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: COLORS.emeraldDeep }}>State Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.state_comparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
              <XAxis dataKey="state_code" fontSize={11} stroke={COLORS.charcoalText} />
              <YAxis fontSize={11} stroke={COLORS.charcoalText} />
              <Tooltip />
              <Bar dataKey="demand_index" radius={[6, 6, 0, 0]}>
                {data.state_comparison.map((s, i) => (
                  <Bar key={i} dataKey="demand_index" fill={s.is_your_state ? COLORS.gold : COLORS.emeraldDeep} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-3" style={{ color: COLORS.emeraldDeep }}>Product Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
                <th className="text-left font-medium text-xs pb-2">Category</th>
                <th className="text-right font-medium text-xs pb-2">Unit Price</th>
                <th className="text-right font-medium text-xs pb-2">Days/Unit</th>
              </tr>
            </thead>
            <tbody>
              {data.product_comparison.map((p) => (
                <tr key={p.category} className="border-t" style={{ borderColor: "#EAE4D6" }}>
                  <td className="py-2" style={{ color: COLORS.charcoalText }}>{p.category}</td>
                  <td className="py-2 text-right font-semibold" style={{ color: COLORS.emeraldDeep }}>&#8377;{p.unit_price}</td>
                  <td className="py-2 text-right" style={{ color: COLORS.charcoalText }}>{p.days_per_unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}