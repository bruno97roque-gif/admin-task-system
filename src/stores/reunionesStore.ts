import { create } from 'zustand'
import type { Reunion } from '../types'
import type { ReunionRequest } from '../services/api'
import {
  createReunionRequest,
  deleteReunionRequest,
  getMisReunionesRequest,
  getReunionesRequest,
  updateReunionRequest,
} from '../services/api'

type Resultado = { success: boolean; error?: string }

interface ReunionesState {
  reuniones: Reunion[]
  /** Momento de la última carga; la página lo usa como «ahora» para separar próximas de pasadas. */
  cargadoEn: number
  loading: boolean
  saving: boolean
  error: string | null
  /** `todas` es el listado de administración; sin eso trae solo las propias. */
  fetchReuniones: (todas: boolean) => Promise<void>
  createReunion: (data: ReunionRequest) => Promise<Resultado>
  updateReunion: (id: number, data: Partial<ReunionRequest>) => Promise<Resultado>
  deleteReunion: (id: number) => Promise<Resultado>
}

function mensajeDe(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export const useReunionesStore = create<ReunionesState>((set) => ({
  reuniones: [],
  cargadoEn: 0,
  loading: false,
  saving: false,
  error: null,

  fetchReuniones: async (todas) => {
    set({ loading: true, error: null })
    try {
      const reuniones = todas ? await getReunionesRequest() : await getMisReunionesRequest()
      set({ reuniones, cargadoEn: Date.now(), loading: false })
    } catch (error) {
      set({ loading: false, error: mensajeDe(error, 'Error al cargar reuniones') })
    }
  },

  createReunion: async (data) => {
    set({ saving: true, error: null })
    try {
      const creada = await createReunionRequest(data)
      set((state) => ({
        reuniones: [...state.reuniones, creada].sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
        ),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al crear la reunión')
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  updateReunion: async (id, data) => {
    set({ saving: true, error: null })
    try {
      const actualizada = await updateReunionRequest(id, data)
      set((state) => ({
        reuniones: state.reuniones
          .map((r) => (r.id === id ? actualizada : r))
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al actualizar la reunión')
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  deleteReunion: async (id) => {
    set({ error: null })
    try {
      await deleteReunionRequest(id)
      set((state) => ({ reuniones: state.reuniones.filter((r) => r.id !== id) }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al eliminar la reunión')
      set({ error: message })
      return { success: false, error: message }
    }
  },
}))
