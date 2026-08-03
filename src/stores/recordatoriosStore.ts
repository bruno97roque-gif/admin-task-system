import { create } from 'zustand'
import type { Recordatorio } from '../types'
import {
  createRecordatorioRequest,
  deleteRecordatorioRequest,
  getRecordatoriosRequest,
  updateRecordatorioRequest,
} from '../services/api'

interface RecordatoriosState {
  recordatorios: Recordatorio[]
  loading: boolean
  saving: boolean
  error: string | null
  fetchRecordatorios: () => Promise<void>
  createRecordatorio: (
    data: { descripcion: string },
  ) => Promise<{ success: boolean; error?: string }>
  updateRecordatorio: (
    id: number,
    data: { descripcion?: string; estado?: boolean },
  ) => Promise<{ success: boolean; error?: string }>
  finalizeRecordatorio: (
    id: number,
  ) => Promise<{ success: boolean; error?: string }>
  deleteRecordatorio: (
    id: number,
  ) => Promise<{ success: boolean; error?: string }>
}

export const useRecordatoriosStore = create<RecordatoriosState>((set, get) => ({
  recordatorios: [],
  loading: false,
  saving: false,
  error: null,

  fetchRecordatorios: async () => {
    set({ loading: true, error: null })
    try {
      const recordatorios = await getRecordatoriosRequest()
      set({ recordatorios, loading: false })
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'Error al cargar recordatorios',
      })
    }
  },

  createRecordatorio: async (data) => {
    set({ saving: true, error: null })
    try {
      await createRecordatorioRequest(data)
      await get().fetchRecordatorios()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al crear el recordatorio'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  updateRecordatorio: async (id, data) => {
    set({ saving: true, error: null })
    try {
      await updateRecordatorioRequest(id, data)
      await get().fetchRecordatorios()
      set({ saving: false })
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al actualizar el recordatorio'
      set({ saving: false, error: message })
      return { success: false, error: message }
    }
  },

  finalizeRecordatorio: async (id) => {
    try {
      await updateRecordatorioRequest(id, { estado: false })
      set((state) => ({
        recordatorios: state.recordatorios.map((r) =>
          r.id === id ? { ...r, estado: false } : r,
        ),
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al finalizar el recordatorio'
      set({ error: message })
      return { success: false, error: message }
    }
  },

  deleteRecordatorio: async (id) => {
    set({ error: null })
    try {
      await deleteRecordatorioRequest(id)
      set((state) => ({
        recordatorios: state.recordatorios.filter((r) => r.id !== id),
      }))
      return { success: true }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar el recordatorio'
      set({ error: message })
      return { success: false, error: message }
    }
  },
}))
