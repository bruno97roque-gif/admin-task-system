import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types'
import type { LoginResponse } from '../services/api'
import { loginRequest, logoutRequest } from '../services/api'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  sessionHydrated: boolean
  setSession: (data: LoginResponse) => void
  clearSession: () => void
  setSessionHydrated: (value: boolean) => void
  login: (user: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

type PersistedAuth = Pick<AuthState, 'user'>

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      sessionHydrated: false,

      setSession: (data) =>
        set({
          accessToken: data.accessToken,
          user: data.user,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      setSessionHydrated: (value) => set({ sessionHydrated: value }),

      login: async (user, password) => {
        try {
          const data = await loginRequest({ user, password })
          set({
            accessToken: data.accessToken,
            user: data.user,
            isAuthenticated: true,
          })
          return { success: true }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Error al iniciar sesión'
          return { success: false, error: message }
        }
      },

      logout: async () => {
        try {
          await logoutRequest()
        } catch {
          // La cookie puede no existir; igual limpiamos sesión local
        } finally {
          set({
            user: null,
            accessToken: null,
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
