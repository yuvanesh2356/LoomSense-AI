import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes, TrendingUp, Package, Calendar, Users, Factory, IndianRupee, PiggyBank,
} from "lucide-react";
import { useAuth } from "../App";
import { getProductionPlan, ProductionPlan } from "../api";
import { COLORS } from "../design-system/brand";

const STEP_ICONS = [Boxes, TrendingUp, Package, Calendar, Users, Factory, IndianRupee, PiggyBank];

export default function ProductionPlanner() {
  const { me } = useAuth();
  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getProductionPlan(me.weaver.id).then((p) => {
      setPlan(p);
      setLoading(false);
    });
  }, [me]);

  if (loading || !plan) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Building your production plan...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Production Planner
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          {plan.summary}
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-2 bottom-2 w-0.5" style={{ backgroundColor: "#EAE4D6" }} />
        <div className="space-y-4">
          {plan.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Boxes;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex items-start gap-4 pl-1"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 border-4"
                  style={{ backgroundColor: COLORS.warmWhite, borderColor: `${COLORS.emeraldDeep}18` }}
                >
                  <Icon size={18} style={{ color: COLORS.emeraldDeep }} />
                </div>
                <div
                  className="flex-1 rounded-2xl border p-4"
                  style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
                    Step {step.step} &middot; {step.title}
                  </p>
                  <p className="text-lg font-bold mt-1" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', Cambria, serif" }}>
                    {step.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-2xl border p-5 flex items-center gap-3"
        style={{ backgroundColor: `${COLORS.gold}12`, borderColor: `${COLORS.gold}40` }}
      >
        <Calendar size={20} style={{ color: COLORS.emeraldDeep }} />
        <p className="text-sm font-medium" style={{ color: COLORS.charcoalText }}>
          Estimated timeline:{" "}
          <span className="font-bold" style={{ color: COLORS.emeraldDeep }}>{plan.timeline_days} days</span>{" "}
          from raw material procurement to finished, sellable pieces.
        </p>
      </div>
    </div>
  );
}