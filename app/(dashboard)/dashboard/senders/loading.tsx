import { SkeletonCard, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function SendersLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Title */}
      <SkeletonTitle />
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Table */}
      <TableSkeleton columns={5} rows={5} />
    </div>
  );
}
