import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeletons/Skeleton";

export default function CampaignsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[140px]" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
        <Skeleton className="h-10 w-[140px] rounded-lg" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-2">
        <Skeleton className="h-8 w-[72px] rounded-md" />
        <Skeleton className="h-8 w-[88px] rounded-md" />
        <Skeleton className="h-8 w-[80px] rounded-md" />
        <Skeleton className="h-8 w-[96px] rounded-md" />
      </div>

      {/* Campaign cards — 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-[160px]" />
                <Skeleton className="h-[22px] w-[72px] rounded-full" />
              </div>
              <SkeletonText variant="long" />
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[60px]" />
                  <Skeleton className="h-5 w-[40px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[50px]" />
                  <Skeleton className="h-5 w-[36px]" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-[70px]" />
                  <Skeleton className="h-5 w-[44px]" />
                </div>
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
