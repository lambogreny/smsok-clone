import { Skeleton, SkeletonCard, SkeletonTitle } from "@/components/skeletons/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Profile Card */}
      <SkeletonCard className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          <Skeleton className="w-16 h-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </SkeletonCard>

      {/* Account Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i}>
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Password Change */}
      <SkeletonCard className="p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </SkeletonCard>

      {/* 2FA */}
      <SkeletonCard className="p-6 md:p-8">
        <div className="flex items-center gap-2.5 mb-5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </SkeletonCard>
    </div>
  );
}
