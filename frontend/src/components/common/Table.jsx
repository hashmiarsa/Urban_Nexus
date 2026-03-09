import clsx from 'clsx'
import Spinner from './Spinner'

export default function Table({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  className,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 overflow-hidden',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-950 border-b border-slate-200 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-slate-400 dark:text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row._id || i}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    'border-b border-slate-100 dark:border-gray-800',
                    'transition-colors duration-100',
                    onRowClick
                      ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800'
                      : 'hover:bg-slate-50/50 dark:hover:bg-gray-800/50'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}