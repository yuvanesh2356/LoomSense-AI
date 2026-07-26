import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, TrendingUp, TrendingDown, PartyPopper, Wallet, AlertTriangle } from "lucide-react";
import { useAuth } from "../App";
import { getAlerts, markAlertRead, AlertItem } from "../api";
import { COLORS } from "../design-system/brand";

const ICONS: Record<string, any> = {
  low_stock: AlertTriangle,
  price_change: TrendingUp,
  festival_approaching: PartyPopper,
  low_income_month: Wallet,
  production_risk: TrendingDown,
};

function severityColor(severity: string) {
  if (severity === "critical") return "#A63A50";
  if (severity === "warning") return COLORS.gold;
  return COLORS.emeraldDeep;
}

export default function SmartAlerts() {
  const { me } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getAlerts(me.weaver.id).then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, [me]);

  async function handleMarkRead(id: number) {
    await markAlertRead(id);
    setAlerts((prev) => prev?.map((a) => (a.id === id ? { ...a, read: true } : a)) ?? null);
  }

  if (loading || !alerts) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Checking for alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Smart Alerts
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Inventory, pricing, festival, income, and production signals \u2014 all derived from your live data.
        </p>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>No active alerts right now.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => {
            const Icon = ICONS[a.alert_type] ?? Bell;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border p-4 flex items-start gap-3"
                style={{ backgroundColor: a.read ? "#FAFAF7" : COLORS.warmWhite, borderColor: "#EAE4D6", opacity: a.read ? 0.6 : 1 }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${severityColor(a.severity)}18` }}>
                  <Icon size={16} style={{ color: severityColor(a.severity) }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: COLORS.emeraldDeep }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>{a.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: COLORS.charcoalText, opacity: 0.4 }}>{new Date(a.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                {!a.read && (
                  <button onClick={() => handleMarkRead(a.id)} className="text-xs font-semibold shrink-0" style={{ color: COLORS.emeraldDeep }}>
                    Mark read
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}