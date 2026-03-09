import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useProject } from '@/hooks/useProjects'
import Spinner from '@/components/common/Spinner'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { formatDate, formatCurrency, TYPE_LABELS, STATUS_LABELS } from '@/utils/formatters'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(id)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="xl" /></div>
  if (!project)  return <div className="p-6 text-slate-500">Project not found.</div>

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={16} /> Back to Projects
      </button>
      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.title}</h1>
          <Badge variant="status" value={project.status} label={STATUS_LABELS[project.status]} />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-500">Type</p><Badge variant="type" value={project.type} label={TYPE_LABELS[project.type]} /></div>
            <div><p className="text-slate-500">Department</p><p className="font-medium text-slate-900 dark:text-white">{project.department?.name}</p></div>
            <div><p className="text-slate-500">Start Date</p><p className="font-medium text-slate-900 dark:text-white">{formatDate(project.startDate)}</p></div>
            <div><p className="text-slate-500">End Date</p><p className="font-medium text-slate-900 dark:text-white">{formatDate(project.endDate)}</p></div>
            <div><p className="text-slate-500">Estimated Cost</p><p className="font-medium text-slate-900 dark:text-white">{formatCurrency(project.estimatedCost)}</p></div>
            <div><p className="text-slate-500">Progress</p><p className="font-medium text-slate-900 dark:text-white">{project.progress || 0}%</p></div>
          </div>
          {project.description && (
            <div><p className="text-slate-500 text-sm mb-1">Description</p><p className="text-sm text-slate-700 dark:text-slate-300">{project.description}</p></div>
          )}
        </div>
      </div>
    </div>
  )
}