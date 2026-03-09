import { motion } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import Spinner from '@/components/common/Spinner'
import { formatDate } from '@/utils/formatters'

export default function MyTasks() {
  const { data, isLoading } = useProjects()
  const tasks = data?.data || []

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">My Tasks</h1>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CheckSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {tasks.map(task => (
              <div key={task._id} className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{task.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{formatDate(task.startDate)} → {formatDate(task.endDate)}</p>
                <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${task.progress || 0}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">{task.progress || 0}%</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}