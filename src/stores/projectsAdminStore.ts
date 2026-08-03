import { create } from 'zustand'
import type { Project } from '../types'
import type { CreateProjectRequest, UpdateProjectRequest } from '../services/api'
import {
  createProjectRequest,
  getProjectsAdminRequest,
  updateProjectRequest,
  updateProjectUsuariosRequest,
} from '../services/api'

interface ProjectsAdminState {
  projects: Project[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectRequest) => Promise<{ success: boolean; error?: string }>
  updateProject: (
    id: number,
    data: UpdateProjectRequest,
    usuariosIds: number[],
  ) => Promise<{ success: boolean; error?: string }>
  getProjectById: (id: number) => Project | undefined
}

export const useProjectsAdminStore = create<ProjectsAdminState>((set, get) => ({
  projects: [],
  loading: false,
  saving: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await getProjectsAdminRequest()
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
      await createProjectRequest(data)
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

  updateProject: async (id, data, usuariosIds) => {
    set({ saving: true, error: null })
    try {
      await updateProjectRequest(id, data)
      await updateProjectUsuariosRequest(id, { usuariosIds })
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

  getProjectById: (id) => get().projects.find((p) => p.id === id),
}))
