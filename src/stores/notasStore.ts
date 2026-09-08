import { create } from 'zustand'
import type { EstadoNota, NotaAdmin } from '../types'
import type { ConsultaNotas } from '../services/api'
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
  /** Total que cumple el filtro, no solo la página en pantalla. */
  total: number
  pagina: number
  porPagina: number
  loading: boolean
  saving: boolean
  error: string | null
  /** `todas` es la bandeja de administración; sin eso trae solo las propias. */
  fetchNotas: (todas: boolean, consulta?: ConsultaNotas) => Promise<void>
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
  total: 0,
  pagina: 1,
  porPagina: 10,
  loading: false,
  saving: false,
  error: null,

  fetchNotas: async (todas, consulta = {}) => {
    set({ loading: true, error: null })
    try {
      const pagina = todas
        ? await getNotasRequest(consulta)
        : await getMisNotasRequest(consulta)
      set({
        notas: pagina.items,
        total: pagina.total,
        pagina: pagina.pagina,
        porPagina: pagina.porPagina,
        loading: false,
      })
    } catch (error) {
      set({ loading: false, error: mensajeDe(error, 'Error al cargar los tickets') })
    }
  },

  createNota: async (data) => {
    set({ saving: true, error: null })
    try {
      const creada = await createNotaRequest(data)
      // Entra a la lista y sube el total: no hace falta releer la página.
      set((state) => ({
        notas: [creada, ...state.notas].slice(0, state.porPagina),
        total: state.total + 1,
        saving: false,
      }))
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
      set((state) => ({
        notas: state.notas.filter((n) => n.id !== id),
        total: Math.max(0, state.total - 1),
      }))
      // La página quedó con un hueco: se recarga para completarla.
      return { success: true }
    } catch (error) {
      const message = mensajeDe(error, 'Error al eliminar el ticket')
      set({ error: message })
      return { success: false, error: message }
    }
  },
}))

