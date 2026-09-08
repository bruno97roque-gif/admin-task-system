import { create } from 'zustand'
import type { NotaAdmin } from '../types'
import {
  createNotaRequest,
  deleteNotaRequest,
  getMisNotasRequest,
  getNotasRequest,
  marcarNotaLeidaRequest,
} from '../services/api'

type Resultado = { success: boolean; error?: string }

interface NotasState {
  notas: NotaAdmin[]
  loading: boolean
  saving: boolean
  error: string | null
  /** `todas` es el panel de administración; sin eso trae solo las propias. */
  fetchNotas: (todas: boolean) => Promise<void>
  createNota: (data: { proyectoId: number; contenido: string }) => Promise<Resultado>
  marcarLeida: (id: number) => Promise<Resultado>
  deleteNota: (id: number) => Promise<Resultado>
}

function mensajeDe(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export const useNotasStore = create<NotasState>((set) => ({
  notas: [],
  loading: false,
  saving: false,
  error: null,

  fetchNotas: async (todas) => {
    set({ loading: true, error: null })
    try {
      const notas = todas ? await getNotasRequest() : await getMisNotasRequest()
      set({ notas, loading: false })
    } catch (error) {
      set({ loading: false, error: mensajeDe(error, 'Error al cargar notas') })
    }
  },

  createNota: async (data) => {
    set({ saving: true, error: null })
    try {
      const creada = await createNotaRequest(data)
      set((state) => ({ notas: [creada, ...state.notas], saving: false }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al enviar la nota')
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  marcarLeida: async (id) => {
    try {
      const leida = await marcarNotaLeidaRequest(id)
      set((state) => ({ notas: state.notas.map((n) => (n.id === id ? leida : n)) }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al marcar la nota')
      set({ error: message })
      return { success: false, error: message }
    }
  },

  deleteNota: async (id) => {
    set({ error: null })
    try {
      await deleteNotaRequest(id)
      set((state) => ({ notas: state.notas.filter((n) => n.id !== id) }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al eliminar la nota')
      set({ error: message })
      return { success: false, error: message }
    }
  },
}))
