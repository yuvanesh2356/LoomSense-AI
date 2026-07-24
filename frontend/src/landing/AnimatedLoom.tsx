import React from "react";
import { motion } from "framer-motion";
import { COLORS } from "../design-system/brand";

/**
 * A stylized, animated handloom: vertical warp threads stay fixed while a
 * horizontal weft "shuttle" sweeps back and forth, leaving a woven pattern
 * of colored bands behind it. Pure SVG + framer-motion — no image assets.
 */
export default function AnimatedLoom({ className = "" }: { className?: string }) {
  const warpCount = 14;
  const width = 440;
  const height = 360;
  const frameInset = 24;
  const warpTop = frameInset + 30;
  const warpBottom = height - frameInset - 30;
  const warpSpacing = (width - frameInset * 2) / (warpCount - 1);

  const bandColors = [COLORS.emeraldDeep, COLORS.gold, COLORS.emeraldBright];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Animated illustration of a traditional handloom weaving"
    >
      {/* Loom frame */}
      <rect
        x={frameInset - 10}
        y={frameInset - 10}
        width={width - (frameInset - 10) * 2}
        height={height - (frameInset - 10) * 2}
        rx={14}
        fill="none"
        stroke={COLORS.emeraldDeep}
        strokeWidth={3}
        opacity={0.25}
      />

      {/* Warp threads (vertical, static) */}
      {Array.from({ length: warpCount }).map((_, i) => {
        const x = frameInset + i * warpSpacing;
        return (
          <line
            key={`warp-${i}`}
            x1={x}
            y1={warpTop}
            x2={x}
            y2={warpBottom}
            stroke={COLORS.darkGreen}
            strokeOpacity={0.28}
            strokeWidth={1.5}
          />
        );
      })}

      {/* Woven horizontal bands (build up progressively, then loop) */}
      {Array.from({ length: 9 }).map((_, row) => {
        const y = warpTop + 14 + row * ((warpBottom - warpTop - 28) / 8);
        const color = bandColors[row % bandColors.length];
        return (
          <motion.line
            key={`band-${row}`}
            x1={frameInset}
            y1={y}
            x2={frameInset}
            y2={y}
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            initial={{ x2: frameInset }}
            animate={{ x2: width - frameInset }}
            transition={{
              duration: 2.4,
              delay: row * 0.25,
              repeat: Infinity,
              repeatDelay: 3.2,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Shuttle — small moving element that "carries" the thread */}
      <motion.rect
        y={warpTop + 6}
        width={22}
        height={10}
        rx={4}
        fill={COLORS.gold}
        initial={{ x: frameInset - 11 }}
        animate={{ x: width - frameInset - 11 }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatDelay: 3.2,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Traditional zari-style corner motif, single accent, not repeated per edge */}
      <g opacity={0.5} stroke={COLORS.gold} strokeWidth={2} fill="none">
        <path d={`M ${frameInset - 10} ${frameInset + 18} q 14 -14 28 0`} />
        <path d={`M ${width - frameInset + 10} ${height - frameInset - 18} q -14 14 -28 0`} />
      </g>
    </svg>
  );
}
