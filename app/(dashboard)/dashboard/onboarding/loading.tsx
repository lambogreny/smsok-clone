import { Skeleton } from "@/components/skeletons/Skeleton";

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Step progress bar */}
      <div className="flex items-center justify-center mb-8 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
            {i < 4 && <Skeleton className="h-0.5 w-12" />}
          </div>
        ))}
      </div>

      {/* Step content card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
