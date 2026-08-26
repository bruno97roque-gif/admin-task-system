import { create } from 'zustand'
import type { Project } from '../types'
import type { CreateProjectRequest, UpdateProjectRequest } from '../services/api'
import {
  createProjectRequest,
  deleteProjectRequest,
  getProjectsRequest,
  updateProjectRequest,
  updateProjectResponsablesRequest,
} from '../services/api'

interface ProjectsState {
  projects: Project[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; error?: string }>
  updateProject: (
    id: number,
    data: UpdateProjectRequest,
  ) => Promise<{ success: boolean; error?: string }>
  updateProjectResponsables: (
    id: number,
    data: { disenadorId: number; desarrolladorId: number },
  ) => Promise<{ success: boolean; error?: string }>
  deleteProject: (id: number) => Promise<{ success: boolean; error?: string }>
  getProjectById: (id: number) => Project | undefined
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  saving: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await getProjectsRequest()
      set({ projects, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar proyectos',
      })
    }
  },

  createProject: async (data) => {
    set({ saving: true, error: null })
    try {
      const project = await createProjectRequest(data)
      if (data.desarrolladorId != null && data.disenadorId != null) {
        await updateProjectResponsablesRequest(project.id, {
          disenadorId: data.disenadorId,
          desarrolladorId: data.desarrolladorId,
        })
      }
      await get().fetchProjects()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al crear el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  updateProject: async (id, data) => {
    set({ saving: true, error: null })
    try {
      await updateProjectRequest(id, data)
      await get().fetchProjects()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  updateProjectResponsables: async (id, data) => {
    set({ saving: true, error: null })
    try {
      await updateProjectResponsablesRequest(id, data)
      await get().fetchProjects()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar responsables'
      set({ saving: false, error: message })
      return { success: false, error: message }
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
      const message =
        error instanceof Error ? error.message : 'Error al eliminar el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id),
}))
