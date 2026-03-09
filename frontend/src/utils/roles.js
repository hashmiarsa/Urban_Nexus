export const ROLES = {
  ADMIN:      'admin',
  OFFICER:    'officer',
  SUPERVISOR: 'supervisor',
  CITIZEN:    'citizen',
}

export const ROLE_LABELS = {
  admin:      'Administrator',
  officer:    'Department Officer',
  supervisor: 'Supervisor',
  citizen:    'Citizen',
}

export const ROLE_COLORS = {
  admin:      'bg-purple-100 text-purple-800',
  officer:    'bg-blue-100 text-blue-800',
  supervisor: 'bg-teal-100 text-teal-800',
  citizen:    'bg-gray-100 text-gray-800',
}

export const can = {
  submitProject:  (role) => [ROLES.ADMIN, ROLES.OFFICER].includes(role),
  approveProject: (role) => role === ROLES.ADMIN,
  resolveConflict:(role) => role === ROLES.ADMIN,
  viewAuditLog:   (role) => role === ROLES.ADMIN,
  updateProgress: (role) => [ROLES.ADMIN, ROLES.SUPERVISOR].includes(role),
  viewAllProjects:(role) => role === ROLES.ADMIN,
  manageUsers:    (role) => role === ROLES.ADMIN,
}

export const getHomeRoute = (role) => {
  switch (role) {
    case ROLES.ADMIN:      return '/dashboard'
    case ROLES.OFFICER:    return '/dept-dashboard'
    case ROLES.SUPERVISOR: return '/tasks'
    default:               return '/'
  }
}