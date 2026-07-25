import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PartyPopper, TrendingUp, Package, IndianRupee } from "lucide-react";
import { useAuth } from "../App";
import { getFestivalPredictions, FestivalPrediction } from "../api";
import { COLORS } from "../design-system/brand";

export default function FestivalPredictor() {
  const { me } = useAuth();
  const [festivals, setFestivals] = useState<FestivalPrediction[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getFestivalPredictions(me.weaver.id).then((data) => {
      setFestivals(data);
      setLoading(false);
    });
  }, [me]);

  if (loading || !festivals) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Loading festival predictions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Festival Predictor
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Upcoming festivals and wedding-season windows for your region, with expected demand
          lift, recommended production, and income estimation for each.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {festivals.map((f, i) => (
          <motion.div
            key={f.festival_name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${COLORS.gold}20` }}
                >
                  <PartyPopper size={18} style={{ color: COLORS.emeraldDeep }} />
                </div>
                <div>
                  <p className="font-display font-semibold" style={{ color: COLORS.emeraldDeep }}>
                    {f.festival_name}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>
                    {f.days_until <= 0 ? "This month" : `${f.days_until} days away`}
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${COLORS.emeraldDeep}12`, color: COLORS.emeraldDeep }}
              >
                +{f.expected_demand_increase_pct}% demand
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <Package size={15} style={{ color: COLORS.charcoalText, opacity: 0.5 }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>{f.recommended_production} units</p>
                  <p className="text-[11px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Recommended production</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee size={15} style={{ color: COLORS.charcoalText, opacity: 0.5 }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>
                    &#8377;{f.income_estimation.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Income estimation</p>
                </div>
              </div>
            </div>

            {f.notes && (
              <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText, opacity: 0.6 }}>
                {f.notes}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}