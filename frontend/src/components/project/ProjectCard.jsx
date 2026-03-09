import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import Badge from '@/components/common/Badge'
import { formatDate, formatCurrency, TYPE_LABELS, STATUS_LABELS } from '@/utils/formatters'

const TYPE_BORDER = {
  road:        'border-l-orange-500',
  water:       'border-l-blue-500',
  electricity: 'border-l-yellow-500',
  sewage:      'border-l-purple-500',
  parks:       'border-l-green-500',
  other:       'border-l-slate-400',
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate()
  const hasClash = project.status === 'clashed'

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className={clsx(
        'relative bg-white dark:bg-gray-900 rounded-card border-l-4 border border-slate-200 dark:border-gray-700',
        'p-5 cursor-pointer shadow-card transition-all duration-150',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        TYPE_BORDER[project.type] || TYPE_BORDER.other
      )}
    >
      {/* Clash indicator */}
      {hasClash && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
      )}

      {/* Header */}
      <div className="mb-3 pr-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
          {project.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {project.department?.name || project.department}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="type"   value={project.type}   label={TYPE_LABELS[project.type]} />
        <Badge variant="status" value={project.status} label={STATUS_LABELS[project.status]} />
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <Calendar size={12} />
        <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Progress</span>
          <span>{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Cost */}
      {project.estimatedCost && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {formatCurrency(project.estimatedCost)}
        </p>
      )}
    </div>
  )
}