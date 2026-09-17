import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types'
import { getSesionRequest, loginRequest, logoutRequest } from '../services/api'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  sessionHydrated: boolean
  /** Lee la sesión de la cookie al abrir la app. */
  cargarSesion: () => Promise<void>
  clearSession: () => void
  setSessionHydrated: (value: boolean) => void
  login: (user: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  /** Aplica cambios del perfil propio sin volver a iniciar sesión. */
  actualizarUsuario: (cambios: Partial<AuthUser>) => void
}

type PersistedAuth = Pick<AuthState, 'user'>

/**
 * La sesión vive en una cookie httpOnly que maneja el API (better-auth). Acá
 * solo queda quién es el usuario; `isAuthenticated` no se guarda: al abrir la
 * app se confirma con el API.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sessionHydrated: false,

      cargarSesion: async () => {
        try {
          const user = await getSesionRequest()
          set({ user, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },

      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      setSessionHydrated: (value) => set({ sessionHydrated: value }),

      login: async (user, password) => {
        try {
          await loginRequest({ user, password })
          const datos = await getSesionRequest()
          set({ user: datos, isAuthenticated: true })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
          return { success: false, error: message }
        }
      },

      actualizarUsuario: (cambios) =>
        set((state) => (state.user ? { user: { ...state.user, ...cambios } } : {})),

      logout: async () => {
        try {
          await logoutRequest()
        } catch {
          // Si la sesión ya no existía, igual se limpia la local.
        } finally {
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },
    }),
    {
      name: 'websy-user',
      partialize: (state): PersistedAuth => ({ user: state.user }),
    },
  ),
)
