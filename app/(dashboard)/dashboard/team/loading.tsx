import { SkeletonButton, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function TeamLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Title + invite button */}
      <div className="flex items-center justify-between">
        <SkeletonTitle />
        <SkeletonButton />
      </div>
      {/* Table */}
      <TableSkeleton columns={4} rows={4} />
    </div>
  );
}
