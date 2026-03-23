import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Loader2, CheckCircle } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import projectApi from '@/api/project.api'
import Spinner from '@/components/common/Spinner'
import Badge from '@/components/common/Badge'
import { formatDate, formatCurrency } from '@/utils/formatters'

function TaskCard({ task, onUpdated }) {
  const [progress, setProgress]   = useState(task.progress || 0)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const [expanded, setExpanded]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await projectApi.updateProgress(task._id, { progress })
      setSaved(true)
      onUpdated()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update progress.')
    } finally {
      setSaving(false)
    }
  }

  const progressColor = progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-blue-500'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-0.5">{task.title}</h3>
          <p className="text-xs text-slate-500">{task.department?.name}</p>
        </div>
        <Badge variant="status" value={task.status} label={task.status} />
      </div>

      {/* Dates + cost */}
      <div className="flex gap-4 text-xs text-slate-500 mb-4">
        <span>ðŸ“… {formatDate(task.startDate)} â†’ {formatDate(task.endDate)}</span>
        <span>ðŸ’° {formatCurrency(task.estimatedCost)}</span>
      </div>

      {/* Current progress bar */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Current Progress</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{task.progress || 0}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2">
          <div
            className={`${progressColor} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${task.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Update progress section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-3 mb-1"
      >
        {expanded ? 'â–² Hide updater' : 'â–¼ Update Progress'}
      </button>

      {expanded && (
        <div className="mt-2 p-4 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>Set new progress</span>
            <span className="font-bold text-emerald-600 text-sm">{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer mb-3"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mb-3">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || progress === (task.progress || 0)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors w-full justify-center"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <CheckCircle size={14} />
            ) : (
              <CheckCircle size={14} />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Progress'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function MyTasks() {
  const { data, isLoading, refetch } = useProjects()
  const tasks = data?.data || []

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">My Tasks</h1>
        <p className="text-sm text-slate-500 mb-6">Projects assigned to you. Update progress as work completes.</p>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CheckSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tasks assigned yet</p>
            <p className="text-sm mt-1">Ask your officer to assign a project to you</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} onUpdated={refetch} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

