import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  valuePrefix?: string;
  valueSuffix?: string;
  valueSize?: "sm" | "md" | "lg";
  delta?: number;
  deltaLabel?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  loading?: boolean;
  className?: string;
}

/* ─── Skeleton ─── */

function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-24 mb-1" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-[32px] w-full mt-2" />
    </div>
  );
}

/* ─── Component ─── */

const VALUE_FONT_SIZE = { sm: 20, md: 24, lg: 32 } as const;

export function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  valuePrefix,
  valueSuffix,
  valueSize = "md",
  delta,
  deltaLabel,
  sparklineData,
  sparklineColor,
  loading,
  className,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton className={className} />;

  return (
    <div
      aria-label={`${label}: ${valuePrefix ?? ""}${value}${valueSuffix ?? ""}`}
      className={cn("rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 max-md:p-4", className)}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 8%, transparent)` }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-[0.05em]">
          {label}
        </span>
      </div>

      {/* Value */}
      <p
        className="font-bold text-[var(--text-primary)] tracking-tight"
        style={{ fontSize: VALUE_FONT_SIZE[valueSize], fontVariantNumeric: "tabular-nums" }}
      >
        {valuePrefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {valueSuffix}
      </p>

      {/* Delta */}
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {delta > 0 ? (
            <TrendingUp size={14} className="text-[var(--success)]" />
          ) : delta < 0 ? (
            <TrendingDown size={14} className="text-[var(--error)]" />
          ) : (
            <Minus size={14} className="text-[var(--text-muted)]" />
          )}
          <span
            className={cn(
              "text-sm font-semibold",
              delta > 0 && "text-[var(--success)]",
              delta < 0 && "text-[var(--error)]",
              delta === 0 && "text-[var(--text-muted)]",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
          {deltaLabel && (
            <span className="text-[11px] text-[var(--text-muted)] ml-1">
              {deltaLabel}
            </span>
          )}
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2">
          <Sparkline data={sparklineData} color={sparklineColor ?? iconColor} height={32} />
        </div>
      )}
    </div>
  );
}
