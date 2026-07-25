import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ExternalLink } from "lucide-react";
import { useAuth } from "../App";
import { getMarketplaceRecommendations, MarketplaceChannelRecommendation } from "../api";
import { COLORS } from "../design-system/brand";

function competitionColor(level: string) {
  if (level === "Low") return COLORS.emeraldDeep;
  if (level === "High") return "#A63A50";
  return COLORS.gold;
}

export default function Marketplace() {
  const { me } = useAuth();
  const [channels, setChannels] = useState<MarketplaceChannelRecommendation[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me) return;
    getMarketplaceRecommendations(me.weaver.id).then((data) => {
      setChannels(data);
      setLoading(false);
    });
  }, [me]);

  if (loading || !channels) {
    return <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Ranking your best-fit marketplaces...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Marketplace Recommendations
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Ranked by fit for your product and current regional demand \u2014 highest score first.
        </p>
      </div>

      <div className="space-y-3">
        {channels.map((c, i) => (
          <motion.div
            key={c.channel_name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${COLORS.emeraldDeep}12` }}
            >
              <ShoppingBag size={20} style={{ color: COLORS.emeraldDeep }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-semibold" style={{ color: COLORS.emeraldDeep }}>{c.channel_name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#F4F1E9", color: COLORS.charcoalText, opacity: 0.7 }}>
                  {c.channel_type}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>{c.reasoning}</p>
              <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
                <span>&#8377;{c.price_band_low.toLocaleString("en-IN")}\u2013{c.price_band_high.toLocaleString("en-IN")} typical price</span>
                <span style={{ color: competitionColor(c.competition_level) }}>&bull; {c.competition_level} competition</span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', Cambria, serif" }}>
                  {c.score}
                </p>
                <p className="text-[10px]" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>fit score</p>
              </div>
              {c.info_url && (
                  <a
                  href={c.info_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl border"
                  style={{ borderColor: "#EAE4D6" }}
                  title="Visit platform"
                >
                  <ExternalLink size={16} style={{ color: COLORS.emeraldDeep }} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}