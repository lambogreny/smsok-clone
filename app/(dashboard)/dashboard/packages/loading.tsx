import { Skeleton, SkeletonCard, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function PackagesLoading() {
  return (
    <div className="px-8 py-8 max-md:px-4 space-y-6">
      {/* Title */}
      <SkeletonTitle />
      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-[240px]">
            <div className="space-y-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
