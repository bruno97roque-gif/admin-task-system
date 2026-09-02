import { useEffect } from 'react'
import { refreshSession } from './lib/api'
import { useAuthStore } from './stores/authStore'
import { AppRouter } from './routes/AppRouter'
import { LoaderScreen } from './components/ui/Loader'

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
    return <LoaderScreen label="Cargando sesión..." />
  }

  return <AppRouter />
}

export default App
