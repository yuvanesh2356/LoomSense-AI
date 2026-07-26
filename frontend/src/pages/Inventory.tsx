import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Boxes } from "lucide-react";
import { useAuth } from "../App";
import { getInventory, InventoryItem } from "../api";
import { COLORS } from "../design-system/brand";

function statusColor(status: string) {
  if (status === "Critical") return "#A63A50";
  if (status === "Low") return COLORS.gold;
  return COLORS.emeraldDeep;
}

export default function Inventory() {
  const { me } = useAuth();
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getInventory(me.weaver.id).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [me]);

  if (loading || !items) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Inventory
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Raw materials and finished goods, with predicted and required stock levels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS.emeraldDeep}12` }}>
                  <Boxes size={18} style={{ color: COLORS.emeraldDeep }} />
                </div>
                <div>
                  <p className="font-display font-semibold" style={{ color: COLORS.emeraldDeep }}>{item.name}</p>
                  <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>{item.item_type === "raw_material" ? "Raw material" : "Finished good"}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${statusColor(item.status)}18`, color: statusColor(item.status) }}>
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>{item.available_stock}{item.unit}</p>
                <p className="text-[10px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Available</p>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>{item.predicted_stock}{item.unit}</p>
                <p className="text-[10px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Predicted</p>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>{item.required_stock}{item.unit}</p>
                <p className="text-[10px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Required</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs" style={{ borderColor: "#EAE4D6", color: COLORS.charcoalText, opacity: 0.6 }}>
              <span>{item.storage_location ?? "No storage location set"}</span>
              {item.expiry_date && <span>Expires {item.expiry_date}</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}