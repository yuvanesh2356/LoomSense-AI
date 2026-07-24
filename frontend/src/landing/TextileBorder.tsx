import React from "react";
import { COLORS } from "../design-system/brand";

/**
 * A single, thin repeating geometric border motif (zari-style diamond
 * chain) — used exactly once at the top of the landing page. Intentionally
 * not repeated on every card/section per design-system guidance: one motif,
 * used deliberately, reads as premium; the same motif everywhere reads as
 * decoration filler.
 */
export default function TextileBorder({ className = "" }: { className?: string }) {
  const unitWidth = 40;
  const units = 30;
  const totalWidth = unitWidth * units;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 28`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <line x1={0} y1={14} x2={totalWidth} y2={14} stroke={COLORS.gold} strokeOpacity={0.35} strokeWidth={1} />
      {Array.from({ length: units }).map((_, i) => {
        const cx = i * unitWidth + unitWidth / 2;
        return (
          <g key={i}>
            <path
              d={`M ${cx - 10} 14 L ${cx} 4 L ${cx + 10} 14 L ${cx} 24 Z`}
              fill="none"
              stroke={COLORS.emeraldDeep}
              strokeWidth={1.4}
              opacity={0.55}
            />
            <circle cx={cx} cy={14} r={2.2} fill={COLORS.gold} opacity={0.8} />
          </g>
        );
      })}
    </svg>
  );
}
