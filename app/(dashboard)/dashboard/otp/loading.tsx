import { Skeleton, SkeletonCard, SkeletonChart, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function OtpLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-[var(--border-default)] pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Chart */}
      <SkeletonChart />
      {/* Table */}
      <TableSkeleton columns={5} rows={5} />
    </div>
  );
}
