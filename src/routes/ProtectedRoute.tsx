import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '../stores/authStore'
import { CambiarContrasenaObligatoriaPage } from '../pages/CambiarContrasenaObligatoriaPage'

export function ProtectedRoute() {
  const sessionHydrated = useAuthStore((s) => s.sessionHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const debeCambiar = useAuthStore((s) => s.user?.debeCambiarContrasena === true)

  if (!sessionHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Con contraseña temporal no se ve nada más hasta cambiarla.
  if (debeCambiar) {
    return <CambiarContrasenaObligatoriaPage />
  }

  return <Outlet />
}
