import { motion } from 'framer-motion'
import { FolderOpen, AlertTriangle, Clock, FileText, Sun, Moon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios.config'
import StatsCard from '@/components/dashboard/StatsCard'
import ActivityChart from '@/components/dashboard/ActivityChart'
import DeptPerformance from '@/components/dashboard/DeptPerformance'
import ConflictAlert from '@/components/conflict/ConflictAlert'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import Logo from '@/components/common/Logo'
import Avatar from '@/components/common/Avatar'
import Button from '@/components/common/Button'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, LayoutDashboard, Layers, Map, BookOpen, LogOut } from 'lucide-react'

function Sidebar() {
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',  to: '/dashboard' },
    { icon: Layers,          label: 'Projects',   to: '/projects'  },
    { icon: AlertTriangle,   label: 'Conflicts',  to: '/conflicts' },
    { icon: Map,             label: 'Map View',   to: '/map'       },
    { icon: BookOpen,        label: 'Audit Log',  to: '/audit'     },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-navy-800 dark:bg-navy-900 flex flex-col z-40">
      <div className="p-4 border-b border-navy-700">
        <Logo showText size="md" to="/dashboard" className="text-white" />
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 pt-4 pb-2">
          Navigation
        </p>
        {navItems.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100
                ${active
                  ? 'bg-navy-600 text-white'
                  : 'text-slate-400 hover:bg-navy-700 hover:text-slate-200'
                }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-navy-700">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <Avatar name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-700 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => api.get('/admin/dashboard').then(r => r.data.data),
  })

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts-open'],
    queryFn:  () => api.get('/conflicts').then(r => r.data.data),
  })

  const openConflicts = conflictsData?.filter(c => c.status === 'open') || []

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar />

      <main className="ml-60 flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Urban Nexus platform overview
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Total Projects"    value={data?.totalProjects    || 0} icon={FolderOpen}    loading={isLoading} />
            <StatsCard title="Active Clashes"    value={data?.activeConflicts  || 0} icon={AlertTriangle} loading={isLoading} alert={data?.activeConflicts > 0} iconColor="text-red-500" iconBg="bg-red-50 dark:bg-red-900/20" />
            <StatsCard title="Pending Approvals" value={data?.pendingApprovals || 0} icon={Clock}         loading={isLoading} iconColor="text-amber-500" iconBg="bg-amber-50 dark:bg-amber-900/20" />
            <StatsCard title="Citizen Reports"   value={data?.citizenReports?.total || 0} icon={FileText} loading={isLoading} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <ActivityChart
                data={data?.projectsByDepartment || []}
                loading={isLoading}
              />
            </div>
            <DeptPerformance
              data={data?.projectsByDepartment || []}
              loading={isLoading}
            />
          </div>

          {/* Open conflicts */}
          {openConflicts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Open Clashes ({openConflicts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {openConflicts.slice(0, 3).map(c => (
                  <ConflictAlert key={c._id} conflict={c} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}