// ─────────────────────────────────────────────
//  CIVIQ — Input Component
//  Inspired by shadcn/ui — exact specs:
//    Height:        40px
//    Border radius: 10px
//    Text size:     14px
//    Label:         14px · weight 600
//    Hint/error:    13px
//    Border:        1px solid
//    Focus ring:    3px soft accent ring
//
//  Variants: text · password · textarea · search
//  States:   default · hover · focus · error · disabled
//  Extras:   label · hint · error message · required dot
//            left icon · right icon
// ─────────────────────────────────────────────

import { useState, forwardRef } from 'react'

// ─── Eye icons for password toggle ────────────
const EyeIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

// ─── Types ─────────────────────────────────────
interface InputProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  value?: string
  defaultValue?: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url'
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  className?: string
  inputClassName?: string
  fullWidth?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  id?: string
  name?: string
  autoComplete?: string
  maxLength?: number
  readOnly?: boolean
}

interface TextareaProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  value?: string
  defaultValue?: string
  rows?: number
  className?: string
  fullWidth?: boolean
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  id?: string
  name?: string
  maxLength?: number
}

// ─── Base class builders ───────────────────────

const getInputClasses = (
  hasError: boolean,
  disabled: boolean,
  hasIconLeft: boolean,
  hasIconRight: boolean,
  extra = ''
) => {
  const base = [
    'w-full h-10 text-sm font-normal',
    'bg-[#FFFFFF] dark:bg-[#1C1C1F]',
    'text-[#09090B] dark:text-[#FAFAFA]',
    'placeholder:text-[#A1A1AA] dark:placeholder:text-[#52525B]',
    'rounded-[10px]',
    'border',
    'outline-none',
    'transition-all duration-150',
    'text-[14px]',
    hasIconLeft  ? 'pl-9'   : 'px-3',
    hasIconRight ? 'pr-9'   : '',
    !hasIconLeft && !hasIconRight ? 'px-3' : '',
  ]

  if (disabled) {
    base.push(
      'border-[#E4E4E7] dark:border-[#27272A]',
      'bg-[#F4F4F5] dark:bg-[#141414]',
      'text-[#A1A1AA] dark:text-[#52525B]',
      'cursor-not-allowed',
      'opacity-60'
    )
  } else if (hasError) {
    base.push(
      'border-[#DC2626] dark:border-[#DC2626]',
      'focus:border-[#DC2626]',
      'focus:ring-2 focus:ring-[#DC2626]/20 dark:focus:ring-[#DC2626]/30',
    )
  } else {
    base.push(
      'border-[#E4E4E7] dark:border-[#27272A]',
      'hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]',
      'focus:border-[#5E6AD2] dark:focus:border-[#5E6AD2]',
      'focus:ring-2 focus:ring-[#5E6AD2]/10 dark:focus:ring-[#5E6AD2]/20',
    )
  }

  if (extra) base.push(extra)
  return base.filter(Boolean).join(' ')
}

// ─── Input Component ───────────────────────────
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  placeholder,
  value,
  defaultValue,
  type = 'text',
  iconLeft,
  iconRight,
  className = '',
  inputClassName = '',
  fullWidth = true,
  onChange,
  onBlur,
  onFocus,
  id,
  name,
  autoComplete,
  maxLength,
  readOnly = false,
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  const hasError = Boolean(error)
  const hasIconLeft = Boolean(iconLeft)
  const hasIconRight = Boolean(iconRight) || isPassword
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={['flex flex-col gap-1.5', fullWidth ? 'w-full' : '', className].join(' ')}>

      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[14px] font-semibold text-[#09090B] dark:text-[#FAFAFA] leading-none"
        >
          {label}
          {required && (
            <span className="text-[#DC2626] text-[13px] leading-none">*</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {/* Left icon */}
        {iconLeft && (
          <span className="absolute left-3 text-[#A1A1AA] dark:text-[#52525B] pointer-events-none flex items-center">
            {iconLeft}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={getInputClasses(hasError, disabled, hasIconLeft, hasIconRight, inputClassName)}
        />

        {/* Right icon — password toggle or custom */}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#A1A1AA] dark:text-[#52525B] hover:text-[#71717A] dark:hover:text-[#A1A1AA] transition-colors flex items-center"
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : iconRight ? (
          <span className="absolute right-3 text-[#A1A1AA] dark:text-[#52525B] pointer-events-none flex items-center">
            {iconRight}
          </span>
        ) : null}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[13px] text-[#DC2626] leading-snug">{error}</p>
      )}

      {/* Hint text — only show if no error */}
      {hint && !error && (
        <p className="text-[13px] text-[#71717A] dark:text-[#71717A] leading-snug">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// ─── Textarea Component ────────────────────────
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  hint,
  error,
  required = false,
  disabled = false,
  placeholder,
  value,
  defaultValue,
  rows = 4,
  className = '',
  fullWidth = true,
  onChange,
  id,
  name,
  maxLength,
}, ref) => {
  const hasError = Boolean(error)
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  const textareaClasses = [
    'w-full text-[14px] font-normal',
    'bg-[#FFFFFF] dark:bg-[#1C1C1F]',
    'text-[#09090B] dark:text-[#FAFAFA]',
    'placeholder:text-[#A1A1AA] dark:placeholder:text-[#52525B]',
    'rounded-[10px]',
    'border',
    'px-3 py-2.5',
    'outline-none',
    'resize-y',
    'transition-all duration-150',
    'leading-relaxed',
    disabled
      ? 'border-[#E4E4E7] dark:border-[#27272A] bg-[#F4F4F5] dark:bg-[#141414] text-[#A1A1AA] cursor-not-allowed opacity-60'
      : hasError
        ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
        : 'border-[#E4E4E7] dark:border-[#27272A] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46] focus:border-[#5E6AD2] focus:ring-2 focus:ring-[#5E6AD2]/10 dark:focus:ring-[#5E6AD2]/20',
  ].filter(Boolean).join(' ')

  return (
    <div className={['flex flex-col gap-1.5', fullWidth ? 'w-full' : '', className].join(' ')}>
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 text-[14px] font-semibold text-[#09090B] dark:text-[#FAFAFA] leading-none"
        >
          {label}
          {required && (
            <span className="text-[#DC2626] text-[13px] leading-none">*</span>
          )}
        </label>
      )}

      <textarea
        ref={ref}
        id={inputId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        onChange={onChange}
        className={textareaClasses}
      />

      {error && (
        <p className="text-[13px] text-[#DC2626] leading-snug">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[13px] text-[#71717A] leading-snug">{hint}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// ─── Search Input ──────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

interface SearchInputProps extends Omit<InputProps, 'type' | 'iconLeft'> {
  onSearch?: () => void
}

const SearchInput = (props: SearchInputProps) => (
  <Input
    {...props}
    type="text"
    iconLeft={<SearchIcon />}
  />
)

export default Input
export { Textarea, SearchInput }
