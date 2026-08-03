import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../stores/authStore'

export function ProtectedRoute() {
  const sessionHydrated = useAuthStore((s) => s.sessionHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!sessionHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
