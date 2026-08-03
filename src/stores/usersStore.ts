import { create } from 'zustand'
import type { AppUser } from '../types'
import type { CreateUserRequest } from '../services/api'
import { createUserRequest, getUsersRequest } from '../services/api'

interface UsersState {
  users: AppUser[]
  loading: boolean
  creating: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (data: CreateUserRequest) => Promise<{ success: boolean; error?: string }>
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  creating: false,
  error: null,

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
}))
