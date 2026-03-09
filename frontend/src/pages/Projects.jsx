import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FolderOpen } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import ProjectCard from '@/components/project/ProjectCard'
import Spinner from '@/components/common/Spinner'
import Button from '@/components/common/Button'

export default function Projects() {
  const { data, isLoading } = useProjects()
  const projects = data?.data || []
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Projects</h1>
          <Button icon={<FolderOpen size={16} />} onClick={() => navigate('?new=1')}>New Project</Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner size="xl" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        )}
      </motion.div>
    </div>
  )
}