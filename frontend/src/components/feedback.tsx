import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Inbox,
  RefreshCw,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { COLORS } from "../design-system/brand";

// --- Skeleton primitives -----------------------------------------------------
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #EDEBE6 25%, #F5F3EE 37%, #EDEBE6 63%)",
        backgroundSize: "400% 100%",
        ...style,
      }}
    />
  );
}

export function CardSkeleton({ lines = 3, height = 120 }: { lines?: number; height?: number }) {
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
      <Skeleton className="h-4 w-2/5 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full mb-2" />
      ))}
      <Skeleton className="mt-2" style={{ height }} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
      <Skeleton className="h-3 w-3/5 mb-3" />
      <Skeleton className="h-6 w-2/5 mb-2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton height={180} />
        <CardSkeleton height={180} />
      </div>
    </div>
  );
}

// --- Empty state --------------------------------------------------------------
export function EmptyState({
  title, description, icon: Icon = Inbox,
}: { title: string; description: string; icon?: LucideIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16"
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${COLORS.emeraldDeep}0F` }}>
        <Icon size={24} style={{ color: COLORS.emeraldDeep }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: COLORS.emeraldDeep }}>{title}</p>
      <p className="text-xs mt-1 max-w-sm" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>{description}</p>
    </motion.div>
  );
}

// --- Error state (with retry) --------------------------------------------------
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16"
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#A63A5015" }}>
        <AlertCircle size={24} style={{ color: "#A63A50" }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: "#A63A50" }}>Something went wrong</p>
      <p className="text-xs mt-1 max-w-sm" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>
        {message || "We couldn't load this right now."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${COLORS.emeraldDeep}12`, color: COLORS.emeraldDeep }}
        >
          <RefreshCw size={13} /> Try again
        </button>
      )}
    </motion.div>
  );
}

// --- Spinner --------------------------------------------------------------------
export function Spinner({ size = 18, color = COLORS.warmWhite }: { size?: number; color?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      className="inline-block rounded-full border-2 border-t-transparent"
      style={{ width: size, height: size, borderColor: color, borderTopColor: "transparent" }}
    />
  );
}

// --- Success pulse (form submit confirmation) -----------------------------------
export function SuccessPulse({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 text-sm font-medium"
      style={{ color: "#3E7C4A" }}
    >
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
        <CheckCircle2 size={16} />
      </motion.span>
      {label}
    </motion.div>
  );
}