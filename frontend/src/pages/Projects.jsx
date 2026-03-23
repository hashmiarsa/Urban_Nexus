import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import ProjectCard from '@/components/project/ProjectCard'
import Spinner from '@/components/common/Spinner'
import Button from '@/components/common/Button'
import ProjectForm from '@/components/project/ProjectForm'

export default function Projects() {
  const { data, isLoading } = useProjects()
  const projects = data?.data || []
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showForm = searchParams.get('new') === '1'

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Projects</h1>
          <Button
            icon={<FolderOpen size={16} />}
            onClick={() => setSearchParams({ new: '1' })}
          >
            New Project
          </Button>
        </div>

        {/* Project Form Modal */}
        {showForm && (
          <ProjectForm onClose={() => setSearchParams({})} />
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <FolderOpen size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">Click "New Project" to submit the first one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}
      </motion.div>
    </div>
  )
}