import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setSesionPerdidaHandler } from './lib/api'
import { useAuthStore } from './stores/authStore'
import './index.css'
import App from './App.tsx'

localStorage.removeItem('websy-auth')

// Si el API dice que la sesión ya no vale, se vuelve al login.
setSesionPerdidaHandler(() => useAuthStore.getState().clearSession())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
