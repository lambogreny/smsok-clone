import { Skeleton, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function LogsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-[110px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-[130px] rounded-lg" />
        <Skeleton className="h-10 w-[110px] rounded-lg" />
        <Skeleton className="h-10 w-[100px] rounded-lg" />
      </div>

      {/* Table with 10 rows, 4 columns */}
      <TableSkeleton columns={4} rows={10} />
    </div>
  );
}
