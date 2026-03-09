import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios.config'
import Spinner from '@/components/common/Spinner'
import { formatDateTime } from '@/utils/formatters'

export default function AuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn:  () => api.get('/admin/audit').then(r => r.data.data),
  })
  const logs = data || []

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Audit Log</h1>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 divide-y divide-slate-100 dark:divide-gray-800">
            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BookOpen size={36} className="mx-auto mb-3 opacity-40" />
                <p>No activity recorded yet</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{log.userId?.name}</span>{' '}
                      {log.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}