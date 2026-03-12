import { Skeleton, SkeletonButton, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function SupportLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonTitle />
        <SkeletonButton />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton columns={5} rows={6} />
    </div>
  );
}
