import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import { useAuth } from "../App";
import { getIncomeCalendar, simulateScenario, IncomeCalendarResponse, SimulationResult } from "../api";
import { Card, ChartCard, Button } from "../components/ui";

const PRODUCT_OPTIONS = ["Cotton Saree", "Silk-Cotton Saree", "Silk Saree"];

export default function IncomePage() {
  const { me } = useAuth();
  const [income, setIncome] = useState<IncomeCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [altProduct, setAltProduct] = useState(PRODUCT_OPTIONS[0]);
  const [altQuantity, setAltQuantity] = useState(10);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (!me) return;
    getIncomeCalendar(me.weaver.id).then((i) => {
      setIncome(i);
      setAltProduct(me.weaver.product_category);
      setLoading(false);
    });
  }, [me]);

  const runSimulation = async () => {
    if (!me) return;
    setSimLoading(true);
    const result = await simulateScenario(me.weaver.id, altProduct, altQuantity);
    setSimResult(result);
    setSimLoading(false);
  };

  if (loading || !income) {
    return <div className="text-[#5B6B7A]">Loading income calendar...</div>;
  }

  const chartData = income.months.map((m) => ({
    month: m.month.slice(5),
    Projected: m.projected,
    Actual: m.actual ?? undefined,
  }));

  const lowMonths = income.months.filter((m) => m.below_safety);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2A2A2A]">Income Calendar</h1>
        <p className="text-[#5B6B7A] mt-1">
          Your rolling 12-month projected vs. actual income, with low-income months
          flagged so you can plan ahead.
        </p>
      </div>

      <ChartCard
        title="Projected vs. Actual Income"
        summary={`Your safety threshold is ₹${income.safety_threshold.toLocaleString(
          "en-IN"
        )}/month — months below this line are flagged.`}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEBE6" />
            <XAxis dataKey="month" stroke="#5B6B7A" fontSize={12} />
            <YAxis stroke="#5B6B7A" fontSize={12} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #EDEBE6" }}
              formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, ""]}
            />
            <Legend />
            <ReferenceLine
              y={income.safety_threshold}
              stroke="#A63A50"
              strokeDasharray="4 4"
              label={{ value: "Safety threshold", fill: "#A63A50", fontSize: 11, position: "insideTopRight" }}
            />
            <Bar dataKey="Projected" fill="#2B3A67" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Actual" fill="#E8A33D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {lowMonths.length > 0 && (
        <Card className="p-5 border-[#A63A50]/20 bg-[#A63A50]/5">
          <p className="text-sm font-semibold text-[#A63A50] mb-1">
            Low-income months flagged
          </p>
          <p className="text-sm text-[#2A2A2A]">
            {lowMonths.map((m) => m.month).join(", ")} — consider adjusting your
            production mix ahead of these months using the simulator below.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[#2A2A2A] mb-1">
          Scenario Simulator — "What if I weave this instead?"
        </h3>
        <p className="text-sm text-[#5B6B7A] mb-4">
          Compare a hypothetical production choice against your current baseline
          recommendation.
        </p>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5B6B7A] mb-1">
              Alternative product
            </label>
            <select
              value={altProduct}
              onChange={(e) => setAltProduct(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B3A67]"
            >
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5B6B7A] mb-1">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={altQuantity}
              onChange={(e) => setAltQuantity(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-[#2B3A67]"
            />
          </div>
          <Button onClick={runSimulation} disabled={simLoading}>
            {simLoading ? "Simulating..." : "Run simulation"}
          </Button>
        </div>

        {simResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#FBF7F0] rounded-xl p-4">
              <p className="text-xs text-[#5B6B7A] font-medium">Current baseline</p>
              <p className="font-semibold text-[#2A2A2A] mt-1">
                {simResult.baseline.product}
              </p>
              <p className="text-sm text-[#5B6B7A]">
                {simResult.baseline.quantity} units · ₹
                {simResult.baseline.projected_income.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-[#FBF7F0] rounded-xl p-4">
              <p className="text-xs text-[#5B6B7A] font-medium">Your scenario</p>
              <p className="font-semibold text-[#2A2A2A] mt-1">
                {simResult.scenario.product}
              </p>
              <p className="text-sm text-[#5B6B7A]">
                {simResult.scenario.quantity} units · ₹
                {simResult.scenario.projected_income.toLocaleString("en-IN")}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 ${
                simResult.income_delta >= 0
                  ? "bg-[#3E7C4A]/10"
                  : "bg-[#A63A50]/10"
              }`}
            >
              <p className="text-xs text-[#5B6B7A] font-medium">Income impact</p>
              <p
                className={`font-bold text-lg mt-1 ${
                  simResult.income_delta >= 0 ? "text-[#3E7C4A]" : "text-[#A63A50]"
                }`}
              >
                {simResult.income_delta >= 0 ? "+" : ""}
                ₹{simResult.income_delta.toLocaleString("en-IN")} (
                {simResult.income_delta_pct}%)
              </p>
              <p className="text-xs text-[#2A2A2A] mt-1">{simResult.recommendation}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}