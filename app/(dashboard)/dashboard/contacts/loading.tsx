import { Skeleton, SkeletonCard, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function ContactsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Search bar */}
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      {/* Table */}
      <TableSkeleton columns={5} rows={8} />
    </div>
  );
}
