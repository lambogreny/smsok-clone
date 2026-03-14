import { Skeleton } from "@/components/skeletons/Skeleton";

export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg-base)]">
      <div className="w-full max-w-[420px]">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-8 h-0.5" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
          <div className="text-center space-y-4">
            <Skeleton className="w-7 h-7 rounded-lg mx-auto" />
            <Skeleton className="h-7 w-48 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
          <div className="space-y-4 mt-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
