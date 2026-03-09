import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import conflictApi from '@/api/conflict.api'
import ConflictAlert from '@/components/conflict/ConflictAlert'
import Spinner from '@/components/common/Spinner'

export default function Conflicts() {
  const { data, isLoading } = useQuery({
    queryKey: ['conflicts'],
    queryFn:  () => conflictApi.getAll().then(r => r.data.data),
  })
  const conflicts = data || []

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Conflicts</h1>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No active conflicts</p>
            <p className="text-sm mt-1">All projects are running smoothly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {conflicts.map(c => <ConflictAlert key={c._id} conflict={c} />)}
          </div>
        )}
      </motion.div>
    </div>
  )
}