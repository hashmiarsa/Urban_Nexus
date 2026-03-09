import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { ROLES, getHomeRoute } from '@/utils/roles'

// Pages
import Login          from '@/pages/Login'
import Dashboard      from '@/pages/Dashboard'
import DeptDashboard  from '@/pages/DeptDashboard'
import Projects       from '@/pages/Projects'
import ProjectDetail  from '@/pages/ProjectDetail'
import Conflicts      from '@/pages/Conflicts'
import MyTasks        from '@/pages/MyTasks'
import MapView        from '@/pages/MapView'
import CitizenReport  from '@/pages/CitizenReport'
import AuditLog       from '@/pages/AuditLog'

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getHomeRoute(user?.role)} replace />
  }

  return children
}

// Redirect logged-in users away from login page
function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) return <Navigate to={getHomeRoute(user?.role)} replace />
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<CitizenReport />} />
      <Route path="/report" element={<CitizenReport />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AuditLog />
          </ProtectedRoute>
        }
      />

      {/* Officer */}
      <Route
        path="/dept-dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.OFFICER]}>
            <DeptDashboard />
          </ProtectedRoute>
        }
      />

      {/* Supervisor */}
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPERVISOR]}>
            <MyTasks />
          </ProtectedRoute>
        }
      />

      {/* Admin + Officer */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OFFICER]}>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OFFICER, ROLES.SUPERVISOR]}>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conflicts"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OFFICER]}>
            <Conflicts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OFFICER, ROLES.SUPERVISOR]}>
            <MapView />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}