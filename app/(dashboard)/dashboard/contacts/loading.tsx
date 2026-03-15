import { Skeleton, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function ContactsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[120px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[130px] rounded-lg" />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-10 w-[100px] rounded-lg" />
      </div>

      {/* Table with 8 rows, 4 columns */}
      <TableSkeleton columns={4} rows={8} />
    </div>
  );
}
