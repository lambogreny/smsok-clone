import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  );
}

export function SkeletonText({ variant = "medium" }: { variant?: "short" | "medium" | "long" | "full" }) {
  const widths = { short: "w-20", medium: "w-40", long: "w-60", full: "w-full" };
  return <Skeleton className={cn("h-4", widths[variant])} />;
}

export function SkeletonTitle() {
  return <Skeleton className="h-5 w-[200px]" />;
}

export function SkeletonBadge() {
  return <Skeleton className="h-[22px] w-[72px] rounded-full" />;
}

export function SkeletonAvatar() {
  return <Skeleton className="h-9 w-9 rounded-full" />;
}

export function SkeletonButton() {
  return <Skeleton className="h-9 w-[120px] rounded-lg" />;
}

export function SkeletonChart() {
  return <Skeleton className="h-[200px] w-full rounded-xl" />;
}

export function SkeletonCard({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4", className)}>
      {children || (
        <div className="space-y-3">
          <SkeletonText variant="short" />
          <Skeleton className="h-8 w-24" />
          <SkeletonText variant="medium" />
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[var(--table-header)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className={cn("flex gap-4 px-4 py-3 border-t border-[var(--border-default)]", r % 2 === 1 && "bg-[var(--table-alt-row)]")}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`r-${r}-c-${c}`} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
