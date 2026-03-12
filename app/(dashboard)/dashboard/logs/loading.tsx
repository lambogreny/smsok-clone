import { Skeleton, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function LogsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <SkeletonTitle />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton columns={6} rows={8} />
    </div>
  );
}
