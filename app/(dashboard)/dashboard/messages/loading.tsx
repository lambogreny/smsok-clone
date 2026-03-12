import { Skeleton, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function MessagesLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Title */}
      <SkeletonTitle />
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-full max-w-xs rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* Table */}
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
