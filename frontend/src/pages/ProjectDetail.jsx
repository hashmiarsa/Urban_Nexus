import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Loader2, User, UserPlus } from 'lucide-react'
import { useProject } from '@/hooks/useProjects'
import projectApi from '@/api/project.api'
import api from '@/api/axios.config'
import useAuthStore from '@/store/authStore'
import Spinner from '@/components/common/Spinner'
import Badge   from '@/components/common/Badge'
import { formatDate, formatCurrency, TYPE_LABELS, STATUS_LABELS } from '@/utils/formatters'

const CriteriaBar = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-500 capitalize">{label.replace(/([A-Z])/g, ' $1')}</span>
      <span className="font-bold text-slate-700 dark:text-slate-300">{value}/10</span>
    </div>
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${value * 10}%` }} />
    </div>
  </div>
)

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin   = user?.role === 'admin'
  const isOfficer = user?.role === 'officer'

  const { data: project, isLoading, refetch } = useProject(id)

  const [actioning, setActioning]       = useState(null)
  const [comment, setComment]           = useState('')
  const [showComment, setShowComment]   = useState(false)
  const [actionError, setActionError]   = useState(null)

  // Supervisor assignment
  const [supervisors, setSupervisors]   = useState([])
  const [selectedSup, setSelectedSup]   = useState('')
  const [assigning, setAssigning]       = useState(false)
  const [assignError, setAssignError]   = useState(null)
  const [assignSuccess, setAssignSuccess] = useState(false)

  // Fetch supervisors list for assignment dropdown
  useEffect(() => {
    if (isAdmin || isOfficer) {
      // Fetch all users and filter supervisors
      api.get('/auth/users').then(res => { const sups = (res.data?.data || []).filter(u => u.role === 'supervisor'); setSupervisors(sups) }).catch(() => {})
    }
  }, [isAdmin, isOfficer])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="xl" /></div>
  if (!project)  return <div className="p-6 text-slate-500">Project not found.</div>

  const handleAction = async (status) => {
    setActioning(status)
    setActionError(null)
    try {
      await projectApi.updateStatus(id, { status, comment })
      await refetch()
      setShowComment(false)
      setComment('')
    } catch (err) {
      setActionError(err?.response?.data?.message || 'Action failed.')
    } finally {
      setActioning(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedSup) return
    setAssigning(true)
    setAssignError(null)
    try {
      await projectApi.assign(id, { supervisorId: selectedSup })
      await refetch()
      setAssignSuccess(true)
      setTimeout(() => setAssignSuccess(false), 2000)
    } catch (err) {
      setAssignError(err?.response?.data?.message || 'Assignment failed.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{project.title}</h1>
            <p className="text-sm text-slate-500">{project.department?.name}</p>
          </div>
          <Badge variant="status" value={project.status} label={STATUS_LABELS?.[project.status] || project.status} />
        </div>

        {/* Admin approve/reject */}
        {isAdmin && (
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Admin Actions</p>
            {actionError && <p className="text-xs text-red-500 mb-3">{actionError}</p>}

            {project.status === 'pending' && (
              <>
                {showComment ? (
                  <div className="space-y-3">
                    <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional comment..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('approved')} disabled={actioning}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                        {actioning === 'approved' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button onClick={() => handleAction('rejected')} disabled={actioning}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                        {actioning === 'rejected' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                      <button onClick={() => setShowComment(false)}
                        className="px-4 py-2 text-sm text-slate-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setShowComment(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm">
                      <CheckCircle size={14} /> Approve Project
                    </button>
                    <button onClick={() => { setShowComment(true) }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm">
                      <XCircle size={14} /> Reject Project
                    </button>
                  </div>
                )}
              </>
            )}

            {project.status === 'approved' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">Project is approved.</span>
                </div>
                <button onClick={() => handleAction('rejected')} disabled={actioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs">
                  {actioning === 'rejected' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Reject
                </button>
              </div>
            )}

            {project.status === 'rejected' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle size={16} />
                  <span className="text-sm font-semibold">Project was rejected.</span>
                </div>
                <button onClick={() => handleAction('approved')} disabled={actioning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs">
                  {actioning === 'approved' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                  Re-approve
                </button>
              </div>
            )}
          </div>
        )}

        {/* Assign Supervisor â€” admin or officer */}
        {(isAdmin || isOfficer) && project.status !== 'rejected' && (
          <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
              <UserPlus size={15} className="inline mr-1.5" />
              Assign Supervisor
            </p>

            {project.assignedTo && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                <User size={14} />
                <span>Currently assigned to: <span className="font-semibold text-slate-800 dark:text-slate-200">{project.assignedTo?.name || 'Supervisor'}</span></span>
              </div>
            )}

            {assignError && <p className="text-xs text-red-500 mb-2">{assignError}</p>}
            {assignSuccess && <p className="text-xs text-emerald-600 mb-2 font-semibold">âœ“ Supervisor assigned successfully!</p>}

            <div className="flex gap-2">
              <select value={selectedSup} onChange={(e) => setSelectedSup(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select supervisor...</option>
                {supervisors.length === 0 ? (
                  <option disabled>No supervisors found</option>
                ) : (
                  supervisors.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))
                )}
              </select>
              <button onClick={handleAssign} disabled={assigning || !selectedSup}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                {assigning ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Assign
              </button>
            </div>
            {supervisors.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">
                No supervisors available. Create a supervisor account first.
              </p>
            )}
          </div>
        )}

        {/* Project info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Type</p>
              <Badge variant="type" value={project.type} label={TYPE_LABELS?.[project.type] || project.type} />
            </div>
            <div>
              <p className="text-slate-500 mb-1">Priority</p>
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{project.priority}</span>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Start Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">End Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate(project.endDate)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Estimated Cost</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(project.estimatedCost)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${project.progress || 0}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{project.progress || 0}%</span>
              </div>
            </div>
          </div>

          {project.description && (
            <div>
              <p className="text-slate-500 text-sm mb-1">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
            </div>
          )}
          {project.address && (
            <div>
              <p className="text-slate-500 text-sm mb-1">Address</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{project.address}</p>
            </div>
          )}
          {project.submittedBy && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <User size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">Submitted by <span className="font-medium text-slate-700 dark:text-slate-300">{project.submittedBy?.name}</span></span>
            </div>
          )}
        </div>

        {/* MCDM Criteria */}
        {project.criteria && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">MCDM Priority Criteria</p>
              {project.mcdmScore && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                  TOPSIS Score: {project.mcdmScore.toFixed(4)}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(project.criteria).map(([key, val]) => (
                <CriteriaBar key={key} label={key} value={val} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



