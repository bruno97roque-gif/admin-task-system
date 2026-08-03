import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { canAccessPath, getHomePathForRole } from '../utils/roleAccess'

export function RoleGuard() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!canAccessPath(user?.roleName, location.pathname)) {
    return <Navigate to={getHomePathForRole(user?.roleName)} replace />
  }

  return <Outlet />
}
