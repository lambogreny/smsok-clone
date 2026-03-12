import { Skeleton, SkeletonButton, SkeletonText, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function SendLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <SkeletonTitle />
      <div className="space-y-4 max-w-2xl">
        <div className="space-y-2">
          <SkeletonText variant="short" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonText variant="short" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonText variant="short" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonText variant="short" />
          <Skeleton className="h-10 w-48" />
        </div>
        <SkeletonButton />
      </div>
    </div>
  );
}
