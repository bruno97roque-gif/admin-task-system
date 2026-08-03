import { create } from 'zustand'
import type { Seguimiento } from '../types'
import { getSeguimientosRequest } from '../services/api'

interface SeguimientosState {
  seguimientos: Seguimiento[]
  loading: boolean
  error: string | null
  fetchSeguimientos: () => Promise<void>
}

export const useSeguimientosStore = create<SeguimientosState>((set) => ({
  seguimientos: [],
  loading: false,
  error: null,

  fetchSeguimientos: async () => {
    set({ loading: true, error: null })
    try {
      const seguimientos = await getSeguimientosRequest()
      set({ seguimientos, loading: false })
    } catch (error) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'Error al cargar seguimientos',
      })
    }
  },
}))
