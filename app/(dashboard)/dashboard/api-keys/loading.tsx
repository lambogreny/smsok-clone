import { Skeleton, SkeletonButton, SkeletonTitle, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function ApiKeysLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonTitle />
        <SkeletonButton />
      </div>
      <TableSkeleton columns={4} rows={5} />
    </div>
  );
}
