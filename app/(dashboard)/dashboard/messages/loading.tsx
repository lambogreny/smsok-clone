import { Skeleton, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function MessagesLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-[160px]" />
        <Skeleton className="h-4 w-[240px]" />
      </div>

      {/* Search bar + filter row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-[120px] rounded-lg" />
        <Skeleton className="h-10 w-[100px] rounded-lg" />
      </div>

      {/* Table with 8 rows, 5 columns */}
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
