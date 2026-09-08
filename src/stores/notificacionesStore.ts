import { create } from 'zustand'
import type { Notificacion } from '../types'
import {
  getNotificacionesRequest,
  marcarNotificacionLeidaRequest,
  marcarTodasLeidasRequest,
} from '../services/api'

interface NotificacionesState {
  notificaciones: Notificacion[]
  noLeidas: number
  loading: boolean
  loaded: boolean
  error: string | null
  fetchNotificaciones: () => Promise<Notificacion[]>
  marcarLeida: (id: number) => Promise<{ success: boolean; error?: string }>
  marcarTodasLeidas: () => Promise<{ success: boolean; error?: string }>
  reset: () => void
}

export const useNotificacionesStore = create<NotificacionesState>((set) => ({
  notificaciones: [],
  noLeidas: 0,
  loading: false,
  loaded: false,
  error: null,

  fetchNotificaciones: async () => {
    set({ loading: true, error: null })
    try {
      const bandeja = await getNotificacionesRequest()
      set({
        notificaciones: bandeja.notificaciones,
        noLeidas: bandeja.noLeidas,
        loading: false,
        loaded: true,
      })
      return bandeja.notificaciones
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar notificaciones',
      })
      return []
    }
  },

  marcarLeida: async (id) => {
    try {
      await marcarNotificacionLeidaRequest(id)
      set((state) => {
        const yaLeida = state.notificaciones.find((n) => n.id === id)?.leidaAt
        return {
          notificaciones: state.notificaciones.map((n) =>
            n.id === id && !n.leidaAt ? { ...n, leidaAt: new Date().toISOString() } : n,
          ),
          noLeidas: yaLeida ? state.noLeidas : Math.max(0, state.noLeidas - 1),
        }
      })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al marcar la notificación'
      set({ error: message })
      return { success: false, error: message }
    }
  },

  marcarTodasLeidas: async () => {
    try {
      await marcarTodasLeidasRequest()
      const ahora = new Date().toISOString()
      set((state) => ({
        notificaciones: state.notificaciones.map((n) =>
          n.leidaAt ? n : { ...n, leidaAt: ahora },
        ),
        noLeidas: 0,
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al marcar las notificaciones'
      set({ error: message })
      return { success: false, error: message }
    }
  },

  reset: () => set({ notificaciones: [], noLeidas: 0, loaded: false, error: null }),
}))
