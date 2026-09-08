import { create } from 'zustand'
import type { EstadoNota, NotaAdmin } from '../types'
import {
  cambiarEstadoNotaRequest,
  createNotaRequest,
  deleteNotaRequest,
  getMisNotasRequest,
  getNotasRequest,
  responderNotaRequest,
} from '../services/api'

type Resultado = { success: boolean; error?: string }

interface NotasState {
  notas: NotaAdmin[]
  loading: boolean
  saving: boolean
  error: string | null
  /** `todas` es el panel de administración; sin eso trae solo las propias. */
  fetchNotas: (todas: boolean) => Promise<void>
  createNota: (data: {
    proyectoId: number
    contenido: string
    categoria?: string
  }) => Promise<Resultado>
  responder: (id: number, contenido: string) => Promise<Resultado>
  cambiarEstado: (id: number, estado: EstadoNota) => Promise<Resultado>
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
      set({ loading: false, error: mensajeDe(error, 'Error al cargar los tickets') })
    }
  },

  createNota: async (data) => {
    set({ saving: true, error: null })
    try {
      const creada = await createNotaRequest(data)
      set((state) => ({ notas: [creada, ...state.notas], saving: false }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al enviar el ticket')
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  responder: async (id, contenido) => {
    set({ saving: true, error: null })
    try {
      const actualizada = await responderNotaRequest(id, contenido)
      set((state) => ({
        notas: state.notas.map((n) => (n.id === id ? actualizada : n)),
        saving: false,
      }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al responder')
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  cambiarEstado: async (id, estado) => {
    set({ error: null })
    try {
      const actualizada = await cambiarEstadoNotaRequest(id, estado)
      set((state) => ({ notas: state.notas.map((n) => (n.id === id ? actualizada : n)) }))
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al cambiar el estado')
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
      const message = mensajeDe(error, 'Error al eliminar el ticket')
      set({ error: message })
      return { success: false, error: message }
    }
  },
}))
