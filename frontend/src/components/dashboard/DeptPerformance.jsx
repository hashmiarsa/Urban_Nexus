import clsx from 'clsx'

export default function DeptPerformance({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 shadow-card">
        <div className="skeleton h-4 w-44 mb-6" />
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton h-10 w-full mb-3" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 shadow-card">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
        Department Performance
      </h3>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No data available</p>
        ) : (
          data.map((dept) => {
            const rate = dept.total > 0
              ? Math.round((dept.onTime / dept.total) * 100)
              : 0

            return (
              <div key={dept.name} className="flex items-center gap-3">
                <div className="w-24 flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {dept.code || dept.name}
                  </p>
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-500',
                      rate >= 80 ? 'bg-teal-500'
                      : rate >= 50 ? 'bg-amber-500'
                      : 'bg-red-500'
                    )}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                  {rate}%
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}