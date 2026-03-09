import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, Search, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import Logo from '@/components/common/Logo'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import reportApi from '@/api/report.api'
import { formatDate } from '@/utils/formatters'
import { Link } from 'react-router-dom'

const ISSUE_TYPES = [
  { value: 'pothole',     label: 'Pothole',       emoji: '🕳️' },
  { value: 'streetlight', label: 'Streetlight',   emoji: '💡' },
  { value: 'water_leak',  label: 'Water Leak',    emoji: '💧' },
  { value: 'garbage',     label: 'Garbage',       emoji: '🗑️' },
  { value: 'other',       label: 'Other',         emoji: '📋' },
]

function TrackSection() {
  const [trackingId, setTrackingId] = useState('')
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleTrack = async () => {
    if (!trackingId.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await reportApi.track(trackingId.trim())
      setResult(res.data.data)
    } catch {
      setError('Report not found. Check your tracking ID.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const STATUS_COLORS = {
    submitted:   'bg-yellow-100 text-yellow-800',
    acknowledged:'bg-blue-100 text-blue-800',
    in_progress: 'bg-teal-100 text-teal-800',
    resolved:    'bg-green-100 text-green-800',
  }

  return (
    <div className="mt-10 pt-8 border-t border-slate-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Track Your Report
      </h2>
      <div className="flex gap-2">
        <input
          value={trackingId}
          onChange={e => setTrackingId(e.target.value.toUpperCase())}
          placeholder="CNR-XXXXXX"
          className="flex-1 h-10 px-3 rounded-button border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
        />
        <Button onClick={handleTrack} loading={loading} icon={<Search size={16} />}>
          Track
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-card border border-slate-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
              {result.trackingId}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[result.status] || ''}`}>
              {result.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 capitalize">
            {result.type?.replace('_', ' ')}
          </p>
          <p className="text-xs text-slate-400">
            Submitted: {formatDate(result.createdAt)}
          </p>
          {result.updatedAt !== result.createdAt && (
            <p className="text-xs text-slate-400">
              Updated: {formatDate(result.updatedAt)}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default function CitizenReport() {
  const [selectedType, setSelectedType] = useState('')
  const [submitted, setSubmitted]       = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const submitMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData()
      formData.append('type', data.type)
      if (data.description) formData.append('description', data.description)
      if (data.photo?.[0])  formData.append('photo', data.photo[0])
      formData.append('latitude',  '28.6139')
      formData.append('longitude', '77.2090')
      return reportApi.submit(formData)
    },
    onSuccess: (res) => {
      setSubmitted(res.data.data)
      reset()
      setSelectedType('')
    },
    onError: () => toast.error('Failed to submit report. Please try again.'),
  })

  const onSubmit = (data) => {
    if (!selectedType) { toast.error('Please select an issue type'); return }
    submitMutation.mutate({ ...data, type: selectedType })
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-modal border border-slate-200 dark:border-gray-700 p-8 text-center shadow-modal"
        >
          <div className="flex justify-center mb-4">
            <CheckCircle size={52} className="text-teal-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Report Submitted!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Your tracking ID:
          </p>
          <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
            <span className="font-mono text-lg font-bold text-navy-800 dark:text-white">
              {submitted.trackingId}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(submitted.trackingId); toast.success('Copied!') }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Save this ID to track your report status
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setSubmitted(null)}>
              Submit Another
            </Button>
            <Button fullWidth onClick={() => setSubmitted(null)}>
              Track Report
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-12 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between px-4">
        <Logo size="sm" />
        <Link
          to="/login"
          className="text-sm font-medium text-navy-600 dark:text-blue-400 hover:underline"
        >
          Officer Login →
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Report a City Issue
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No account needed. Takes 30 seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Issue type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Issue Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ISSUE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all duration-100
                      ${selectedType === type.value
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <span className="text-2xl">{type.emoji}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe the issue briefly..."
                className="w-full px-3 py-2 rounded-button border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm resize-vertical focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Photo <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                {...register('photo')}
                type="file"
                accept="image/*"
                className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-button file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
            </div>

            {/* Location note */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-gray-800 rounded-lg p-3">
              <MapPin size={14} className="text-teal-500 flex-shrink-0" />
              <span>
                Map pin selection coming soon. Location will be detected automatically.
              </span>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={submitMutation.isPending}
            >
              Submit Report
            </Button>
          </form>

          <TrackSection />
        </motion.div>
      </div>
    </div>
  )
}