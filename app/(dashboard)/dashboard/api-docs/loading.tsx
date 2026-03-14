import { Skeleton } from "@/components/skeletons/Skeleton";

export default function ApiDocsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6 max-w-5xl">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ทั้งหมด", "SMS", "OTP", "Contacts", "Templates", "Account"].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />

      {/* Endpoint cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-14 rounded" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-24 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
