import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy, h:mm a')
  } catch {
    return '—'
  }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return '—'
  }
}

export const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (num) => {
  if (num == null) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const STATUS_LABELS = {
  pending:   'Pending',
  approved:  'Approved',
  ongoing:   'Ongoing',
  completed: 'Completed',
  rejected:  'Rejected',
  clashed:   'Clashed',
}

export const TYPE_LABELS = {
  road:        'Road',
  water:       'Water',
  electricity: 'Electricity',
  sewage:      'Sewage',
  parks:       'Parks',
  other:       'Other',
}

export const PRIORITY_LABELS = {
  low:      'Low',
  medium:   'Medium',
  high:     'High',
  critical: 'Critical',
}