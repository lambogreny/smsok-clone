import { Skeleton, SkeletonButton, SkeletonCard, SkeletonText, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function CheckoutLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <SkeletonTitle />
      <div className="max-w-lg">
        <SkeletonCard>
          <div className="space-y-4">
            <SkeletonText variant="medium" />
            <Skeleton className="h-10 w-full" />
            <SkeletonText variant="medium" />
            <Skeleton className="h-10 w-full" />
            <SkeletonText variant="medium" />
            <Skeleton className="h-10 w-full" />
            <SkeletonButton />
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
