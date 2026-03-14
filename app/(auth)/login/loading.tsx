import { Skeleton } from "@/components/skeletons/Skeleton";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
          <div className="text-center space-y-4">
            <Skeleton className="w-7 h-7 rounded-lg mx-auto" />
            <Skeleton className="h-7 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
          <div className="space-y-5 mt-8">
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
