import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useAuth } from "../App";
import {
  getForecast, getIncomeCalendar, getStabilityScore,
  Forecast, IncomeCalendarResponse, StabilityScore,
} from "../api";
import { Card, StatWidget, ChartCard, ProgressRing, Button } from "../components/ui";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { me } = useAuth();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [income, setIncome] = useState<IncomeCalendarResponse | null>(null);
  const [stability, setStability] = useState<StabilityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    const weaverId = me.weaver.id;
    Promise.all([
      getForecast(weaverId),
      getIncomeCalendar(weaverId),
      getStabilityScore(weaverId),
    ]).then(([f, i, s]) => {
      setForecast(f);
      setIncome(i);
      setStability(s);
      setLoading(false);
    });
  }, [me]);

  if (loading || !forecast || !income || !stability) {
    return <div className="text-[#5B6B7A]">Loading your dashboard...</div>;
  }

  const chartData = income.months.map((m) => ({
    month: m.month.slice(5),
    projected: m.projected,
    actual: m.actual ?? null,
  }));

  const upcomingLowMonths = income.months.filter((m) => m.below_safety);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2A2A2A]">
          Welcome back, {me?.weaver.name}
        </h1>
        <p className="text-[#5B6B7A] mt-1">
          {me?.weaver.cluster} cluster · {me?.weaver.product_category}
        </p>
      </div>

      {/* Flagship "What to weave next" card */}
      <Card className="p-8 bg-gradient-to-br from-[#2B3A67] to-[#3d4d80] text-white border-none">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="max-w-xl">
            <p className="uppercase text-xs tracking-widest text-white/60 font-semibold mb-2">
              What should I weave next?
            </p>
            <h2 className="text-3xl font-bold leading-snug">{forecast.product}</h2>
            <p className="text-white/80 mt-3 leading-relaxed">{forecast.reason}</p>
            <div className="flex items-center gap-4 mt-5">
              <span className="text-4xl font-bold">{forecast.quantity}</span>
              <span className="text-white/70 text-sm">units, ready by<br />
                <span className="font-semibold text-white">
                  {new Date(forecast.target_date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long",
                  })}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
              {Math.round(forecast.confidence * 100)}% confidence
            </span>
            <Link to="/forecast">
              <Button variant="secondary">View full forecast &rarr;</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget
          label="Income Stability Score"
          value={stability.score}
          sublabel="out of 100 — higher is more stable"
          accent="#3E7C4A"
        />
        <StatWidget
          label="Confidence Tier"
          value={forecast.confidence_tier}
          sublabel={`${Math.round(forecast.confidence * 100)}% model confidence`}
          accent="#E8A33D"
        />
        <StatWidget
          label="Upcoming Low-Income Months"
          value={upcomingLowMonths.length}
          sublabel="flagged in your 12-month calendar"
          accent="#A63A50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Income Snapshot"
            summary="Projected vs. actual monthly income across your rolling 12-month calendar."
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="proj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2B3A67" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2B3A67" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
                <XAxis dataKey="month" stroke="#5B6B7A" fontSize={12} />
                <YAxis stroke="#5B6B7A" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }}
                  formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#2B3A67"
                  fill="url(#proj)"
                  strokeWidth={2}
                  name="Projected"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#E8A33D"
                  fill="none"
                  strokeWidth={2}
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-[#5B6B7A]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2B3A67]" /> Projected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8A33D]" /> Actual
              </span>
            </div>
          </ChartCard>
        </div>

        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-[#2A2A2A] mb-3">
            Income Stability Score
          </p>
          <ProgressRing value={stability.score} size={120} />
          <p className="text-xs text-[#5B6B7A] mt-4 leading-relaxed">
            Built from your income variance, product diversity, payment
            timeliness, and cluster demand exposure.
          </p>
          <Link to="/income" className="mt-4">
            <Button variant="outline">View income calendar</Button>
          </Link>
        </Card>
      </div>

      {upcomingLowMonths.length > 0 && (
        <Card className="p-5 border-[#A63A50]/20 bg-[#A63A50]/5">
          <p className="text-sm font-semibold text-[#A63A50]">
            ⚠ {upcomingLowMonths.length} upcoming month(s) flagged below your income
            safety threshold: {upcomingLowMonths.map((m) => m.month).join(", ")}
          </p>
        </Card>
      )}
    </div>
  );
}