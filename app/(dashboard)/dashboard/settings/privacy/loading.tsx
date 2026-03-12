import { Skeleton, SkeletonCard } from "@/components/skeletons/Skeleton";

export default function PrivacyLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Title */}
      <Skeleton className="h-5 w-[200px]" />
      {/* Consent cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} className="h-[140px]">
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        </SkeletonCard>
      ))}
      {/* History table */}
      <SkeletonCard className="h-[200px]" />
    </div>
  );
}
