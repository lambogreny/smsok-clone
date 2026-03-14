import { Skeleton } from "@/components/skeletons/Skeleton";

export default function CreditsLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-36 mb-1" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>

      {/* Hero skeleton */}
      <div className="rounded-lg p-8 bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="flex flex-col items-center">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-12 w-40 mb-5" />
          <Skeleton className="h-2 w-full max-w-md mb-6" />
          <div className="grid grid-cols-3 gap-4 w-full pt-5 border-t border-[var(--border-default)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages skeleton */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i === 0 ? "1px solid var(--border-default)" : "none" }}
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-1 w-[100px]" />
            <Skeleton className="h-4 w-28 ml-auto" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <Skeleton className="h-9 w-64" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[120px_1fr_100px_100px] gap-x-4 px-5 py-3"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
