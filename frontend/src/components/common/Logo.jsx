import { Link } from 'react-router-dom'
import clsx from 'clsx'

function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="8"  cy="8"  r="2" fill="#0E9F6E" />
      <circle cx="16" cy="8"  r="2" fill="#0E9F6E" />
      <circle cx="24" cy="8"  r="2" fill="#0E9F6E" />
      <circle cx="8"  cy="16" r="2" fill="#0E9F6E" />
      <circle cx="16" cy="16" r="4" fill="#0F2744" />
      <circle cx="24" cy="16" r="2" fill="#0E9F6E" />
      <circle cx="8"  cy="24" r="2" fill="#0E9F6E" />
      <circle cx="16" cy="24" r="2" fill="#0E9F6E" />
      <circle cx="24" cy="24" r="2" fill="#0E9F6E" />
      <line x1="8"  y1="8"  x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="8"  x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="8"  y1="24" x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="24" x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="8"  y1="16" x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="24" y1="16" x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="8"  x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="24" x2="16" y2="16" stroke="#0E9F6E" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

export default function Logo({ size = 'md', showText = true, to = '/', className }) {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-lg'   },
    lg: { icon: 48, text: 'text-2xl'  },
  }
  const s = sizes[size] || sizes.md

  return (
    <Link
      to={to}
      className={clsx('flex items-center gap-2 no-underline', className)}
    >
      <LogoIcon size={s.icon} />
      {showText && (
        <span className={clsx('font-bold leading-none', s.text)}>
          <span className="text-navy-800 dark:text-white">Urban</span>
          <span className="text-teal-500">Nexus</span>
        </span>
      )}
    </Link>
  )
}