import { Skeleton, SkeletonCard, SkeletonChart, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-[180px]" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts — 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}
