import { useEffect } from 'react'
import { refreshSession } from './lib/api'
import { useAuthStore } from './stores/authStore'
import { AppRouter } from './routes/AppRouter'

function App() {
  const sessionHydrated = useAuthStore((s) => s.sessionHydrated)

  useEffect(() => {
    let cancelled = false

    async function bootstrapSession() {
      if (!useAuthStore.getState().isAuthenticated) {
        await refreshSession()
      }
      if (!cancelled) {
        useAuthStore.getState().setSessionHydrated(true)
      }
    }

    bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [])

  if (!sessionHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-slate-400">
        Cargando sesión...
      </div>
    )
  }

  return <AppRouter />
}

export default App
