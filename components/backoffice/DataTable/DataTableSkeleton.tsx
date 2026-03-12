import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
}

const WIDTHS = ["w-[60%]", "w-[45%]", "w-[70%]", "w-[55%]", "w-[40%]", "w-[65%]", "w-[50%]", "w-[75%]"];

export function DataTableSkeleton({ columns, rows = 5 }: DataTableSkeletonProps) {
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 w-20" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={`r-${row}`}
          className="flex gap-4 px-4 py-3 border-b border-[rgba(26,35,50,0.5)]"
          style={{ animationDelay: `${row * 50}ms` }}
        >
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton
              key={`c-${row}-${col}`}
              className={`h-4 ${WIDTHS[(row + col) % WIDTHS.length]}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
