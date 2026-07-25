import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, ExternalLink } from "lucide-react";
import { useAuth } from "../App";
import { getHeatmapStates, matchGovernmentSchemes, HeatmapStateSummary, SchemeMatch } from "../api";
import { COLORS } from "../design-system/brand";

export default function GovernmentSchemes() {
  const { me } = useAuth();
  const [states, setStates] = useState<HeatmapStateSummary[]>([]);
  const [age, setAge] = useState(35);
  const [state, setState] = useState("");
  const [occupation, setOccupation] = useState("Handloom Weaver");
  const [income, setIncome] = useState(120000);
  const [gender, setGender] = useState("Female");
  const [shg, setShg] = useState(false);
  const [results, setResults] = useState<SchemeMatch[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHeatmapStates().then((data) => {
      setStates(data);
      if (me && data.some((s) => s.state_name === me.weaver.region)) {
        setState(me.weaver.region);
      } else if (data.length > 0) {
        setState(data[0].state_name);
      }
    });
  }, [me]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const data = await matchGovernmentSchemes({
      weaver_id: me?.weaver.id,
      age, state, occupation, income, gender, shg,
    });
    setResults(data);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Government Scheme Advisor
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Enter your details to see which schemes you're eligible for, with benefits and how to apply.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
      >
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Age</label>
          <input type="number" min={16} max={90} value={age} onChange={(e) => setAge(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }}>
            {states.map((s) => (
              <option key={s.state_code} value={s.state_name}>{s.state_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Occupation</label>
          <input value={occupation} onChange={(e) => setOccupation(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Annual Income (\u20b9)</label>
          <input type="number" min={0} value={income} onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#EAE4D6" }}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input id="shg" type="checkbox" checked={shg} onChange={(e) => setShg(e.target.checked)} />
          <label htmlFor="shg" className="text-sm" style={{ color: COLORS.charcoalText }}>Member of a Self-Help Group (SHG)</label>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={submitting || !state}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
            style={{ backgroundColor: COLORS.emeraldDeep }}
          >
            {submitting ? "Matching schemes..." : "Find my schemes"}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {results.length === 0 ? (
              <p className="text-sm" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
                No schemes matched these details. Try adjusting income, state, or SHG status.
              </p>
            ) : (
              results.map((r) => (
                <div
                  key={r.scheme_id}
                  className="rounded-2xl border p-5"
                  style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${COLORS.gold}20` }}>
                      <Landmark size={18} style={{ color: COLORS.emeraldDeep }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold" style={{ color: COLORS.emeraldDeep }}>{r.scheme_name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#F4F1E9", color: COLORS.charcoalText, opacity: 0.7 }}>
                          {r.category}
                        </span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.75 }}>{r.description}</p>
                      <p className="text-xs mt-2 font-semibold" style={{ color: COLORS.emeraldDeep }}>Benefits</p>
                      <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.7 }}>{r.benefits}</p>
                      <p className="text-xs mt-2" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>{r.eligibility_notes}</p>
                      {r.apply_link && (
                        <a href={r.apply_link} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3"
                          style={{ color: COLORS.emeraldDeep }}>
                          Apply <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}