import clsx from 'clsx'
import Spinner from './Spinner'

export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  icon,
  onClick,
  type = 'button',
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-button transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-navy-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-900 hover:-translate-y-px hover:shadow-md',
    secondary: 'bg-transparent text-navy-600 border border-navy-600 hover:bg-blue-50 focus:ring-blue-500 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 hover:-translate-y-px hover:shadow-md',
    ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
    success:   'bg-teal-500 text-white hover:bg-green-600 focus:ring-teal-400 hover:-translate-y-px hover:shadow-md',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3   text-base',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        base,
        variants[variant] || variants.primary,
        sizes[size]       || sizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" color={variant === 'ghost' ? 'dark' : 'light'} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  )
}