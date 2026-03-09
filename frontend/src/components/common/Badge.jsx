import clsx from 'clsx'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved:  'bg-blue-100   text-blue-800   border border-blue-300   dark:bg-blue-900/30   dark:text-blue-300',
  ongoing:   'bg-green-100  text-green-800  border border-green-300  dark:bg-green-900/30  dark:text-green-300',
  completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected:  'bg-red-100    text-red-800    border border-red-300    dark:bg-red-900/30    dark:text-red-300',
  clashed:   'bg-red-100    text-red-800    border border-red-300    dark:bg-red-900/30    dark:text-red-300',
}

const TYPE_STYLES = {
  road:        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  water:       'bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300',
  electricity: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  sewage:      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  parks:       'bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300',
  other:       'bg-slate-100  text-slate-800  dark:bg-slate-700     dark:text-slate-300',
}

const PRIORITY_STYLES = {
  low:      'bg-slate-100  text-slate-700  dark:bg-slate-700 dark:text-slate-300',
  medium:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30 dark:text-blue-300',
  high:     'bg-amber-100  text-amber-800  dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-red-100    text-red-800    dark:bg-red-900/30 dark:text-red-300',
}

export default function Badge({ label, variant = 'status', value, className }) {
  const styleMap = {
    status:   STATUS_STYLES,
    type:     TYPE_STYLES,
    priority: PRIORITY_STYLES,
  }

  const styles = styleMap[variant]?.[value] || 'bg-slate-100 text-slate-700'

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        styles,
        className
      )}
    >
      {label || value}
    </span>
  )
}