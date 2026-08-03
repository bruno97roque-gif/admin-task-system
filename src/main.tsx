import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setAccessTokenGetter, setSessionHandlers } from './lib/api'
import { useAuthStore } from './stores/authStore'
import './index.css'
import App from './App.tsx'

localStorage.removeItem('websy-auth')

setAccessTokenGetter(() => useAuthStore.getState().accessToken)
setSessionHandlers(
  (data) => useAuthStore.getState().setSession(data),
  () => useAuthStore.getState().clearSession(),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
