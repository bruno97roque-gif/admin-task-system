import { create } from 'zustand'
import type { Role } from '../types'
import { createRoleRequest, getRolesRequest } from '../services/api'

interface RolesState {
  roles: Role[]
  loading: boolean
  creating: boolean
  error: string | null
  fetchRoles: () => Promise<void>
  createRole: (name: string) => Promise<{ success: boolean; error?: string }>
}

export const useRolesStore = create<RolesState>((set, get) => ({
  roles: [],
  loading: false,
  creating: false,
  error: null,

  fetchRoles: async () => {
    set({ loading: true, error: null })
    try {
      const roles = await getRolesRequest()
      set({ roles, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar roles',
      })
    }
  },

  createRole: async (name) => {
    set({ creating: true, error: null })
    try {
      await createRoleRequest({ name })
      await get().fetchRoles()
      set({ creating: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al crear el rol'
      set({ creating: false, error: message })
      return { success: false, error: message }
    }
  },
}))
