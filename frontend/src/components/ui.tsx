import React from "react";

// --- Card --------------------------------------------------------------------
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

// --- Button --------------------------------------------------------------------
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
}) {
  const styles: Record<string, string> = {
    primary: "bg-[#2B3A67] text-white hover:bg-[#232f54]",
    secondary: "bg-[#E8A33D] text-white hover:bg-[#d6922e]",
    outline: "bg-white text-[#2B3A67] border border-[#2B3A67] hover:bg-[#2B3A67]/5",
  };
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// --- Confidence Badge -----------------------------------------------------------
export function ConfidenceBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    High: "bg-[#3E7C4A]/10 text-[#3E7C4A] border-[#3E7C4A]/30",
    Medium: "bg-[#C98A1A]/10 text-[#C98A1A] border-[#C98A1A]/30",
    Emerging: "bg-[#5B6B7A]/10 text-[#5B6B7A] border-[#5B6B7A]/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
        styles[tier] || styles.Emerging
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {tier} confidence
    </span>
  );
}

// --- Stat Widget -----------------------------------------------------------------
export function StatWidget({
  label,
  value,
  sublabel,
  accent = "#2B3A67",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-[#5B6B7A] font-medium">
        {label}
      </p>
      <p className="text-3xl font-bold mt-1" style={{ color: accent }}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-[#5B6B7A] mt-1">{sublabel}</p>}
    </Card>
  );
}

// --- Chart Card wrapper (title + one-line summary + chart slot) -----------------
export function ChartCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-[#2A2A2A]">{title}</h3>
      <p className="text-sm text-[#5B6B7A] mt-1 mb-4">{summary}</p>
      {children}
    </Card>
  );
}

// --- Progress Ring (for Income Stability Score) ---------------------------------
export function ProgressRing({ value, size = 96 }: { value: number; size?: number }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#3E7C4A" : value >= 45 ? "#C98A1A" : "#A63A50";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#EDEBE6"
        strokeWidth={8}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fill: color }}
        fontSize="22"
        fontWeight="700"
      >
        {value}
      </text>
    </svg>
  );
}

// --- Factor bar (explainability contribution row) --------------------------------
export function FactorRow({ factor, contribution }: { factor: string; contribution: string }) {
  const isPositive = contribution.trim().startsWith("+");
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-[#2A2A2A]">{factor}</span>
      <span
        className={`text-sm font-semibold ${
          isPositive ? "text-[#3E7C4A]" : "text-[#A63A50]"
        }`}
      >
        {contribution}
      </span>
    </div>
  );
}