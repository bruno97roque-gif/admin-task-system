import { create } from 'zustand'
import type { Project } from '../types'
import {
  getProjectsByDisenoRequest,
  updateProjectRequest,
  type UpdateProjectRequest,
} from '../services/api'

function buildUpdatePayloadFromProject(
  project: Project,
  overrides: {
    comentario: string
    fechaEntrega: string | null
    estadoProyecto: string
  },
): UpdateProjectRequest {
  return {
    name: project.name,
    descripcion: project.descripcion,
    grupo: project.grupo,
    seguimientoId: project.seguimientoId,
    comentario: overrides.comentario,
    tecnologia: project.tecnologia,
    tipoProyecto: project.tipoProyecto,
    estadoPago: project.estadoPago,
    estadoProyecto: overrides.estadoProyecto,
    diasSinResponder: project.diasSinResponder,
    fechaEntrega: overrides.fechaEntrega,
  }
}

interface ProjectsByDisenoState {
  projects: Project[]
  loading: boolean
  error: string | null
  fetchProjectsByDiseno: (disenadorId?: number) => Promise<void>
  saving: boolean
  updateProject: (
    project: Project,
    data: {
      comentario: string
      fechaEntrega: string | null
      estadoProyecto: string
    },
  ) => Promise<{ success: boolean; error?: string }>
}

export const useProjectsByDisenoStore = create<ProjectsByDisenoState>((set) => ({
  projects: [],
  loading: false,
  error: null,
  saving: false,

  fetchProjectsByDiseno: async (disenadorId) => {
    set({ loading: true, error: null })
    try {
      const projects = await getProjectsByDisenoRequest(disenadorId)
      set({ projects, loading: false })
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'Error al cargar proyectos de diseño',
      })
    }
  },

  updateProject: async (project, data) => {
    set({ saving: true, error: null })
    try {
      const updated = await updateProjectRequest(
        project.id,
        buildUpdatePayloadFromProject(project, {
          comentario: data.comentario.trim(),
          fechaEntrega: data.fechaEntrega,
          estadoProyecto: data.estadoProyecto,
        }),
      )
      set((state) => ({
        projects: state.projects.map((item) => (item.id === project.id ? updated : item)),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar el proyecto'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },
}))
