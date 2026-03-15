import { Skeleton, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function SendersLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[150px]" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <Skeleton className="h-10 w-[150px] rounded-lg" />
      </div>

      {/* Table with 6 rows, 3 columns */}
      <TableSkeleton columns={3} rows={6} />
    </div>
  );
}
