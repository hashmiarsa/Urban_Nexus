import clsx from 'clsx'
import { getInitials } from '@/utils/formatters'

const COLORS = [
  'bg-blue-100   text-blue-800',
  'bg-teal-100   text-teal-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100  text-amber-800',
  'bg-rose-100   text-rose-800',
  'bg-indigo-100 text-indigo-800',
]

function getColor(name = '') {
  const index = name.charCodeAt(0) % COLORS.length
  return COLORS[index]
}

export default function Avatar({ name, size = 'md', className }) {
  const sizes = {
    xs: 'w-6  h-6  text-xs',
    sm: 'w-8  h-8  text-xs',
    md: 'w-9  h-9  text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg',
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizes[size] || sizes.md,
        getColor(name),
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}