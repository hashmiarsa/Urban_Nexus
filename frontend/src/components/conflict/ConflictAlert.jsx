import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/utils/formatters'
import Button from '@/components/common/Button'

export default function ConflictAlert({ conflict }) {
  const navigate = useNavigate()

  return (
    <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-card p-4 border-l-4 border-l-red-500">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0 mt-0.5">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
            Clash Detected
          </p>

          <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400 mb-2 flex-wrap">
            <span className="font-medium truncate max-w-[120px]">
              {conflict.projectA?.title || 'Project A'}
            </span>
            <ArrowRight size={12} className="flex-shrink-0" />
            <span className="font-medium truncate max-w-[120px]">
              {conflict.projectB?.title || 'Project B'}
            </span>
          </div>

          {conflict.overlapDates && (
            <p className="text-xs text-red-600 dark:text-red-500 mb-3">
              Overlap: {formatDate(conflict.overlapDates.start)} â†’{' '}
              {formatDate(conflict.overlapDates.end)}
            </p>
          )}

          <Button
            size="sm"
            variant="danger"
            onClick={() => navigate(`/conflicts/${conflict._id}`)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}
