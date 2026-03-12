export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden animate-fade-in">
      <div className="flex gap-4 px-5 py-3 border-b border-white/5">
        {[120, 200, 80, 100, 80].map((w, i) => (
          <div key={i} className="skeleton h-3 rounded" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-5 py-4 border-b border-white/[0.02]"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-4 stagger-children`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5">
          <div className="skeleton h-3 w-16 rounded mb-3" />
          <div className="skeleton h-7 w-20 rounded mb-2" />
          <div className="skeleton h-2 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-6 animate-fade-in">
      <div className="skeleton h-5 w-32 rounded mb-4" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}
