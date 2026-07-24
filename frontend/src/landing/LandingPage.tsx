import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedLoom from "./AnimatedLoom";
import TextileBorder from "./TextileBorder";
import { APP_NAME, APP_TAGLINE, COLORS } from "../design-system/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" },
  }),
};

function StatChip({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      custom={delay}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 px-5 py-3 shadow-sm"
    >
      <div
        className="text-2xl font-bold"
        style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', Cambria, serif" }}
      >
        {value}
      </div>
      <div className="text-xs mt-0.5" style={{ color: COLORS.charcoalText, opacity: 0.7 }}>
        {label}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: COLORS.ivory }}
    >
      {/* Ambient background glow — subtle, not a stripe/border */}
      <div
        className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: COLORS.emeraldBright }}
      />
      <div
        className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: COLORS.gold }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16">
        <TextileBorder className="w-full h-6 mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: hero copy */}
          <div>
            <motion.p
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="uppercase text-xs font-semibold tracking-[0.2em] mb-4"
              style={{ color: COLORS.gold }}
            >
              Handloom Hackathon 2026 &middot; Grand Finale
            </motion.p>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="text-5xl md:text-6xl font-bold leading-tight mb-5"
              style={{ color: COLORS.emeraldDeep, fontFamily: "'Fraunces', Cambria, serif" }}
            >
              {APP_NAME}
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.2}
              variants={fadeUp}
              className="text-lg md:text-xl mb-3"
              style={{ color: COLORS.charcoalText }}
            >
              {APP_TAGLINE}
            </motion.p>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
              className="text-base mb-10 max-w-lg"
              style={{ color: COLORS.charcoalText, opacity: 0.75 }}
            >
              AI-powered demand forecasting, income stability, and production
              intelligence &mdash; built for India's 3.5 million handloom
              weavers, one forecast at a time.
            </motion.p>

            {/* Glassmorphism CTA card */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.4}
              variants={fadeUp}
              className="inline-block rounded-3xl p-1.5 backdrop-blur-xl border border-white/60 shadow-lg"
              style={{ background: "rgba(255,255,255,0.35)" }}
            >
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-3 rounded-2xl px-8 py-4 font-semibold text-white shadow-md overflow-hidden"
                style={{ backgroundColor: COLORS.emeraldDeep }}
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      `linear-gradient(120deg, transparent, ${COLORS.gold}55, transparent)`,
                  }}
                  animate={{ x: ["-100%", "220%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative z-10">Enter Experience</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  &rarr;
                </motion.span>
              </motion.button>
            </motion.div>

            <div className="flex flex-wrap gap-3 mt-8">
              <StatChip value="3.5M+" label="Weaver households" delay={0.5} />
              <StatChip value="12" label="Handloom clusters modeled" delay={0.58} />
              <StatChip value="82%" label="Forecast confidence" delay={0.66} />
            </div>
          </div>

          {/* Right: animated loom */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-[2rem] backdrop-blur-md border border-white/50"
              style={{ background: "rgba(255,255,255,0.35)" }}
            />
            <div className="relative p-8">
              <AnimatedLoom className="w-full h-auto" />
            </div>
          </motion.div>
        </div>

        <TextileBorder className="w-full h-6 mt-16 scale-y-[-1]" />
      </div>
    </div>
  );
}
