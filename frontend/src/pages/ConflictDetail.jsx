import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Trophy, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import conflictApi from '@/api/conflict.api'
import projectApi  from '@/api/project.api'
import useAuthStore from '@/store/authStore'
import Spinner from '@/components/common/Spinner'
import Badge   from '@/components/common/Badge'
import { formatDate, formatCurrency } from '@/utils/formatters'

const ScoreBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100)
  return (
    <div className="space-y-1 mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">MCDM Score</span>
        <span className="font-bold text-emerald-600">{(score || 0).toFixed(4)}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const ProjectCard = ({ project, score, isWinner }) => (
  <div className={`flex-1 p-5 rounded-2xl border-2 ${
    isWinner
      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  }`}>
    {isWinner && (
      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full w-fit mb-3">
        <Trophy size={12} /> Execute First
      </div>
    )}
    <p className="font-bold text-slate-900 dark:text-white text-base mb-1">{project?.title || '—'}</p>
    <p className="text-xs text-slate-500 mb-2">{project?.department?.name || project?.department}</p>
    <div className="flex gap-2 mb-3 flex-wrap">
      <Badge variant="type"   value={project?.type}   label={project?.type} />
      <Badge variant="status" value={project?.status} label={project?.status} />
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
      <p>📅 {formatDate(project?.startDate)} → {formatDate(project?.endDate)}</p>
      <p>💰 {formatCurrency(project?.estimatedCost)}</p>
      <p>⚡ Priority: <span className="font-medium capitalize">{project?.priority}</span></p>
    </div>
    <ScoreBar score={score} />

    {project?.criteria && (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-slate-500 mb-2">MCDM Criteria</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(project.criteria).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{v}/10</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

export default function ConflictDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [conflict, setConflict]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [resolved, setResolved]   = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await conflictApi.getById(id)
        setConflict(res.data.data)
      } catch {
        setError('Failed to load conflict details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleResolve = async () => {
    if (!resolution.trim()) return
    setResolving(true)
    try {
      await conflictApi.resolve(id, { resolution, status: 'resolved' })
      setResolved(true)
      setConflict(prev => ({ ...prev, status: 'resolved', resolution }))
    } catch {
      setError('Failed to resolve conflict.')
    } finally {
      setResolving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="xl" /></div>
  if (error)   return <div className="p-6 text-red-500">{error}</div>
  if (!conflict) return <div className="p-6 text-slate-500">Conflict not found.</div>

  const scoreA   = conflict.recommendation?.scores?.projectA
  const scoreB   = conflict.recommendation?.scores?.projectB
  const order    = conflict.recommendation?.order || []
  const winnerIsA = order[0] === conflict.projectA?._id?.toString() ||
                    order[0] === conflict.projectA?._id

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-6">
      <button onClick={() => navigate('/conflicts')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6">
        <ArrowLeft size={16} /> Back to Conflicts
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Conflict Detail</h1>
          <p className="text-sm text-slate-500">
            Status: <span className={`font-semibold ${conflict.status === 'resolved' ? 'text-emerald-600' : 'text-red-500'}`}>
              {conflict.status?.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {/* Overlap info */}
      {conflict.overlapDates && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            📅 Temporal Overlap: {formatDate(conflict.overlapDates.start)} → {formatDate(conflict.overlapDates.end)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Both projects are scheduled at the same location during this period.
          </p>
        </div>
      )}

      {/* Side-by-side project comparison */}
      <div className="flex gap-4 mb-6 flex-col md:flex-row">
        <ProjectCard
          project={conflict.projectA}
          score={scoreA}
          isWinner={winnerIsA}
        />
        <div className="flex items-center justify-center flex-shrink-0">
          <ArrowRight size={24} className="text-slate-400" />
        </div>
        <ProjectCard
          project={conflict.projectB}
          score={scoreB}
          isWinner={!winnerIsA}
        />
      </div>

      {/* Recommendation */}
      {conflict.recommendation?.explanation && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
            🤖 Engine Recommendation
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {conflict.recommendation.explanation}
          </p>
        </div>
      )}

      {/* Execution order */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          📋 Recommended Execution Order
        </p>
        <div className="space-y-2">
          {[conflict.projectA, conflict.projectB]
            .sort((a, b) => {
              const aFirst = order[0] === a?._id?.toString() || order[0] === a?._id
              return aFirst ? -1 : 1
            })
            .map((p, i) => (
              <div key={p?._id} className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-emerald-500' : 'bg-slate-400'
                }`}>{i + 1}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{p?.title}</span>
                {i === 0 && <span className="text-xs text-emerald-600 font-semibold">← Start here</span>}
              </div>
            ))
          }
        </div>
      </div>

      {/* Resolve form — admin only */}
      {isAdmin && conflict.status === 'open' && (
        <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            ✅ Resolve This Conflict
          </p>
          {resolved ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={18} />
              <span className="text-sm font-semibold">Conflict marked as resolved.</span>
            </div>
          ) : (
            <>
              <textarea
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter resolution note, e.g. 'Water pipeline to proceed first. Road repair rescheduled to August.'"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
              />
              <button
                onClick={handleResolve}
                disabled={resolving || !resolution.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {resolving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {resolving ? 'Resolving...' : 'Mark as Resolved'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Already resolved */}
      {conflict.status === 'resolved' && conflict.resolution && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Resolution Note</p>
          <p className="text-sm text-emerald-800 dark:text-emerald-300">{conflict.resolution}</p>
        </div>
      )}
    </div>
  )
}