import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getHeatmapStates, recommendWhatToWeave, HeatmapStateSummary, WeaveRecommendation } from "../api";
import { useAuth } from "../App";
import { COLORS } from "../design-system/brand";

function riskColor(level: string) {
  if (level === "High") return "#A63A50";
  if (level === "Medium") return COLORS.gold;
  return COLORS.emeraldDeep;
}

export default function WhatShouldIWeave() {
  const { me } = useAuth();
  const [states, setStates] = useState<HeatmapStateSummary[]>([]);
  const [region, setRegion] = useState("");
  const [rawMaterialKg, setRawMaterialKg] = useState(5);
  const [budget, setBudget] = useState(10000);
  const [timeDays, setTimeDays] = useState(14);
  const [results, setResults] = useState<WeaveRecommendation[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHeatmapStates().then((data) => {
      setStates(data);
      if (me && data.some((s) => s.state_name === me.weaver.region)) setRegion(me.weaver.region);
      else if (data.length) setRegion(data[0].state_name);
    });
  }, [me]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data = await recommendWhatToWeave({
      weaver_id: me?.weaver.id, region, raw_material_kg: rawMaterialKg, budget, time_available_days: timeDays,
    });
    setResults(data);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          What Should I Weave?
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Tell us your region, available raw material, budget, and time \u2014 we'll rank the best products to weave.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }}>
            {states.map((s) => <option key={s.state_code} value={s.state_name}>{s.state_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Raw material available (kg)</label>
          <input type="number" min={0} value={rawMaterialKg} onChange={(e) => setRawMaterialKg(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Budget (&#8377;)</label>
          <input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Time available (days)</label>
          <input type="number" min={1} value={timeDays} onChange={(e) => setTimeDays(Number(e.target.value))} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" disabled={submitting || !region} className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: COLORS.emeraldDeep }}>
            <Sparkles size={15} /> {submitting ? "Thinking..." : "Get recommendations"}
          </button>
        </div>
      </form>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map((r, i) => (
            <motion.div key={r.category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl border p-5" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold" style={{ color: COLORS.emeraldDeep }}>{r.category}</p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${riskColor(r.risk_level)}18`, color: riskColor(r.risk_level) }}>
                  {r.risk_level} risk
                </span>
              </div>
              <p className="text-2xl font-bold mt-3" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', serif" }}>{r.quantity} units</p>
              <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Expected income: &#8377;{r.expected_income.toLocaleString("en-IN")}</p>
              <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText, opacity: 0.6 }}>{r.market_note}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}