import { Skeleton, SkeletonButton, SkeletonCard, SkeletonText, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function TemplatesLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonTitle />
        <SkeletonButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonText variant="medium" />
            <SkeletonText variant="long" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
