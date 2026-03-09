import clsx from 'clsx'
import CountUp from 'react-countup'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor   = 'text-blue-600',
  iconBg      = 'bg-blue-50 dark:bg-blue-900/20',
  trend,
  trendLabel,
  alert       = false,
  loading     = false,
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 shadow-card">
        <div className="skeleton h-4 w-24 mb-4" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-32" />
      </div>
    )
  }

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-900 rounded-card border shadow-card p-6',
      'transition-all duration-150 hover:shadow-card-hover hover:-translate-y-0.5',
      alert
        ? 'border-red-200 dark:border-red-900'
        : 'border-slate-200 dark:border-gray-700'
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={clsx('p-2 rounded-lg', iconBg)}>
            <Icon size={20} className={iconColor} />
          </div>
        )}
      </div>

      <p className={clsx(
        'text-3xl font-bold mb-1',
        alert ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
      )}>
        <CountUp end={Number(value) || 0} duration={1.5} separator="," />
      </p>

      {(trend != null || trendLabel) && (
        <div className="flex items-center gap-1 mt-1">
          {trend != null && (
            trend >= 0
              ? <TrendingUp  size={14} className="text-teal-500" />
              : <TrendingDown size={14} className="text-red-500" />
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  )
}