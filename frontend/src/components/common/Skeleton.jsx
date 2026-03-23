// ---------------------------------------------------------------------------
// Skeleton.jsx â€” Shimmer loading placeholders
//
// Usage:
//   <Skeleton className="h-4 w-32" />
//   <Skeleton.Card />       â€” project card placeholder
//   <Skeleton.Table rows={5} cols={4} />  â€” table placeholder
//   <Skeleton.Stat />       â€” stats card placeholder
// ---------------------------------------------------------------------------

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
  />
);

// Single stats card skeleton
Skeleton.Stat = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
    <div className="h-3 w-32 bg-gray-100 dark:bg-gray-600 rounded" />
  </div>
);

// Project / conflict card skeleton
Skeleton.Card = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-600 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-100 dark:bg-gray-600 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-gray-100 dark:bg-gray-600 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-600 rounded" />
    </div>
    <div className="flex items-center gap-2 pt-1">
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded" />
      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-600 rounded" />
    </div>
  </div>
);

// Table skeleton
Skeleton.Table = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse space-y-3">
    {/* Header */}
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="grid gap-4 py-2 border-t border-gray-100 dark:border-gray-700"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-3 bg-gray-100 dark:bg-gray-600 rounded"
            style={{ width: `${60 + Math.random() * 35}%` }}
          />
        ))}
      </div>
    ))}
  </div>
);

// List item skeleton
Skeleton.List = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-600 rounded" />
        </div>
        <div className="h-6 w-14 bg-gray-100 dark:bg-gray-600 rounded-full" />
      </div>
    ))}
  </div>
);

export default Skeleton;
