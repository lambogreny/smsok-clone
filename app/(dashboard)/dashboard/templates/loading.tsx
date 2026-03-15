import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeletons/Skeleton";

export default function TemplatesLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[130px]" />
          <Skeleton className="h-4 w-[230px]" />
        </div>
        <Skeleton className="h-10 w-[140px] rounded-lg" />
      </div>

      {/* Template cards — 3x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-5 w-[140px]" />
              <div className="space-y-2">
                <SkeletonText variant="full" />
                <SkeletonText variant="long" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-[80px]" />
                <Skeleton className="h-[22px] w-[60px] rounded-full" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
