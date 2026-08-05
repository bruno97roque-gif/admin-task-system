import { create } from 'zustand'
import type { Project } from '../types'
import {
  getProjectsByProgramadorRequest,
  updateProjectRequest,
  type UpdateProjectRequest,
} from '../services/api'

function buildUpdatePayloadFromProject(
  project: Project,
  overrides: { comentario: string; fechaEntrega: string | null },
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
    estadoProyecto: project.estadoProyecto,
    diasSinResponder: project.diasSinResponder,
    fechaEntrega: overrides.fechaEntrega,
  }
}

interface ProjectsByProgramadorState {
  projects: Project[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchProjectsByProgramador: (programadorId?: number) => Promise<void>
  updateProjectComentario: (
    project: Project,
    data: { comentario: string; fechaEntrega: string | null },
  ) => Promise<{ success: boolean; error?: string }>
}

export const useProjectsByProgramadorStore = create<ProjectsByProgramadorState>((set) => ({
  projects: [],
  loading: false,
  saving: false,
  error: null,

  fetchProjectsByProgramador: async (programadorId) => {
    set({ loading: true, error: null })
    try {
      const projects = await getProjectsByProgramadorRequest(programadorId)
      set({ projects, loading: false })
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al cargar proyectos por programador',
      })
    }
  },

  updateProjectComentario: async (project, data) => {
    set({ saving: true, error: null })
    try {
      const updated = await updateProjectRequest(
        project.id,
        buildUpdatePayloadFromProject(project, {
          comentario: data.comentario.trim(),
          fechaEntrega: data.fechaEntrega,
        }),
      )
      set((state) => ({
        projects: state.projects.map((p) => (p.id === project.id ? updated : p)),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar el comentario'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },
}))
