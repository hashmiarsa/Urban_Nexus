import clsx from 'clsx'

export default function Spinner({ size = 'md', color = 'primary', className }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-4',
  }

  const colors = {
    primary: 'border-blue-600 border-t-transparent',
    light:   'border-white border-t-transparent',
    dark:    'border-slate-700 border-t-transparent',
    teal:    'border-teal-500 border-t-transparent',
  }

  return (
    <div
      className={clsx(
        'rounded-full animate-spin',
        sizes[size]  || sizes.md,
        colors[color] || colors.primary,
        className
      )}
    />
  )
}