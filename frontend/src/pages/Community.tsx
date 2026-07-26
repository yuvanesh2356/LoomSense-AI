import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CalendarDays } from "lucide-react";
import { useAuth } from "../App";
import { getNearbyCommunity, getCommunityEvents, CommunityProfile, CommunityEvent } from "../api";
import { COLORS } from "../design-system/brand";

export default function Community() {
  const { me } = useAuth();
  const [profiles, setProfiles] = useState<CommunityProfile[] | null>(null);
  const [events, setEvents] = useState<CommunityEvent[] | null>(null);

  useEffect(() => {
    if (!me) return;
    getNearbyCommunity(me.weaver.id).then(setProfiles);
    getCommunityEvents().then(setEvents);
  }, [me]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Community
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Nearby weavers, self-help groups, mentors, and upcoming events in your cluster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles?.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.emeraldDeep}12` }}>
                  <Users size={16} style={{ color: COLORS.emeraldDeep }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.emeraldDeep }}>{p.name}</p>
                  <p className="text-[11px] capitalize" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>{p.profile_type} &middot; {p.cluster}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>{p.bio}</p>
            </motion.div>
          )) ?? <p style={{ color: COLORS.charcoalText, opacity: 0.5 }}>Loading nearby community...</p>}
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2" style={{ color: COLORS.emeraldDeep }}>
            <CalendarDays size={17} /> Upcoming Events
          </h3>
          <div className="space-y-3">
            {events?.map((e) => (
              <div key={e.id} className="pb-3 border-b last:border-0" style={{ borderColor: "#EAE4D6" }}>
                <p className="text-sm font-semibold" style={{ color: COLORS.emeraldDeep }}>{e.title}</p>
                <p className="text-xs mt-0.5" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>{e.description}</p>
                <p className="text-[11px] mt-1" style={{ color: COLORS.charcoalText, opacity: 0.45 }}>{e.event_date} &middot; {e.region}</p>
              </div>
            )) ?? <p className="text-sm" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>Loading events...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}