import { SkeletonCard, SkeletonChart, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <SkeletonTitle />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonChart />
      <SkeletonChart />
    </div>
  );
}
