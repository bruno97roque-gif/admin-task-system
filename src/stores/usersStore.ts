import { create } from 'zustand'
import type { AppUser } from '../types'
import type { CreateUserRequest } from '../services/api'
import {
  createUserRequest,
  getUsersRequest,
  updatePasswordRequest,
  updateUserEmailRequest,
  updateUserActiveRequest,
  updateUserPuestosRequest,
  updateUserRoleRequest,
} from '../services/api'

interface UsersState {
  users: AppUser[]
  loading: boolean
  creating: boolean
  saving: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (data: CreateUserRequest) => Promise<{ success: boolean; error?: string }>
  updatePassword: (id: number, password: string) => Promise<{ success: boolean; error?: string }>
  updateEmail: (
    id: number,
    email: string | null,
  ) => Promise<{ success: boolean; error?: string }>
  updateRol: (id: number, roleId: number) => Promise<{ success: boolean; error?: string }>
  updatePuestos: (
    id: number,
    puestos: import('../types').Puesto[],
  ) => Promise<{ success: boolean; error?: string }>
  updateActive: (id: number, active: boolean) => Promise<{ success: boolean; error?: string }>
  /** Refleja en la lista un cambio hecho en otra parte (p. ej. mi perfil). */
  actualizarLocal: (id: number, cambios: Partial<AppUser>) => void
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  creating: false,
  saving: false,
  error: null,

  updateRol: async (id, roleId) => {
    try {
      const actualizado = await updateUserRoleRequest(id, roleId)
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, roleId: actualizado.roleId } : u)),
      }))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al cambiar el rol',
      }
    }
  },

  updatePuestos: async (id, puestos) => {
    set({ saving: true, error: null })
    try {
      const actualizado = await updateUserPuestosRequest(id, puestos)
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, puestos: actualizado.puestos } : u,
        ),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al guardar los puestos'
      set({ saving: false, error: mensaje })
      return { success: false, error: mensaje }
    }
  },

  updateActive: async (id, active) => {
    set({ saving: true, error: null })
    try {
      const actualizado = await updateUserActiveRequest(id, active)
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, active: actualizado.active } : u)),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : 'Error al cambiar el estado'
      set({ saving: false, error: mensaje })
      return { success: false, error: mensaje }
    }
  },

  actualizarLocal: (id, cambios) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...cambios } : u)),
    })),

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const users = await getUsersRequest()
      set({ users, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar usuarios',
      })
    }
  },

  createUser: async (data) => {
    set({ creating: true, error: null })
    try {
      await createUserRequest(data)
      await get().fetchUsers()
      set({ creating: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al crear el usuario'
      set({ creating: false, error: message })
      return { success: false, error: message }
    }
  },

  updatePassword: async (id, password) => {
    set({ saving: true, error: null })
    try {
      const actualizado = await updatePasswordRequest(id, password)
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, debeCambiarContrasena: actualizado.debeCambiarContrasena } : u,
        ),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar la contraseña'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  updateEmail: async (id, email) => {
    set({ saving: true, error: null })
    try {
      const actualizado = await updateUserEmailRequest(id, email)
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, email: actualizado.email } : u)),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al guardar el correo'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },
}))
