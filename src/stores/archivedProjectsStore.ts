import { create } from 'zustand'
import type { ProjectArchivado } from '../types'
import {
  deleteProjectRequest,
  getArchivedProjectsRequest,
  reactivarProjectRequest,
} from '../services/api'

interface ArchivedProjectsState {
  projects: ProjectArchivado[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  deleteProject: (id: number) => Promise<{ success: boolean; error?: string }>
  reactivarProject: (id: number) => Promise<{ success: boolean; error?: string }>
}

export const useArchivedProjectsStore = create<ArchivedProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  saving: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await getArchivedProjectsRequest()
      set({ projects, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar proyectos archivados',
      })
    }
  },

  deleteProject: async (id) => {
    set({ saving: true, error: null })
    try {
      await deleteProjectRequest(id)
      await get().fetchProjects()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  reactivarProject: async (id) => {
    set({ saving: true, error: null })
    try {
      await reactivarProjectRequest(id)
      await get().fetchProjects()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reactivar el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },
}))
