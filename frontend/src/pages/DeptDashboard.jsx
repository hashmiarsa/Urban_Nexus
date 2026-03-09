import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { FolderOpen, AlertTriangle, Clock, LogOut, Moon, Sun, Map, Layers, LayoutDashboard } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import Logo from '@/components/common/Logo'
import Avatar from '@/components/common/Avatar'
import StatsCard from '@/components/dashboard/StatsCard'
import { useProjects } from '@/hooks/useProjects'
import ProjectCard from '@/components/project/ProjectCard'
import Button from '@/components/common/Button'

export default function DeptDashboard() {
  const { user, logout }     = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate               = useNavigate()
  const { data, isLoading }    = useProjects()
  const projects               = data?.data || []

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dept-dashboard' },
    { icon: Layers,          label: 'Projects',  to: '/projects'       },
    { icon: AlertTriangle,   label: 'Conflicts', to: '/conflicts'      },
    { icon: Map,             label: 'Map',       to: '/map'            },
  ]

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-navy-800 dark:bg-navy-900 flex flex-col z-40">
        <div className="p-4 border-b border-navy-700">
          <Logo size="md" to="/dept-dashboard" />
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ icon: Icon, label, to }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${location.pathname === to ? 'bg-navy-600 text-white' : 'text-slate-400 hover:bg-navy-700 hover:text-slate-200'}`}
            >
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-700">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar name={user?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.department?.code || 'Officer'}</p>
            </div>
            <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={() => { logout(); navigate('/login') }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-700">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Good morning, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.department?.name || 'Your Department'}
              </p>
            </div>
            <Button onClick={() => navigate('/projects?new=1')} icon={<FolderOpen size={16} />}>
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatsCard title="My Projects"      value={projects.length}                                   icon={FolderOpen}    loading={isLoading} />
            <StatsCard title="Pending Approval" value={projects.filter(p => p.status === 'pending').length} icon={Clock}      loading={isLoading} iconColor="text-amber-500" iconBg="bg-amber-50" />
            <StatsCard title="Active Clashes"   value={projects.filter(p => p.status === 'clashed').length} icon={AlertTriangle} loading={isLoading} alert />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">My Projects</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="skeleton h-44 rounded-card" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No projects yet</p>
                <p className="text-sm mt-1">Submit your department's first project</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(p => <ProjectCard key={p._id} project={p} />)}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}