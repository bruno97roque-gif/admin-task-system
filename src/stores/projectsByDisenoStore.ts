import { create } from 'zustand'
import type { Project } from '../types'
import { getProjectsByDisenoRequest } from '../services/api'

interface ProjectsByDisenoState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjectsByDiseno: () => Promise<void>
}

export const useProjectsByDisenoStore = create<ProjectsByDisenoState>((set) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjectsByDiseno: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await getProjectsByDisenoRequest()
      set({ projects, loading: false })
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'Error al cargar proyectos de diseño',
      })
    }
  },
}))
