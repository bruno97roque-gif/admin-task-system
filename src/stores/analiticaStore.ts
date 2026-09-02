import { create } from 'zustand'
import type { Analitica } from '../types'
import { getAnaliticaRequest } from '../services/api'

interface AnaliticaState {
  data: Analitica | null
  loading: boolean
  error: string | null
  fetchAnalitica: () => Promise<void>
}

export const useAnaliticaStore = create<AnaliticaState>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchAnalitica: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getAnaliticaRequest()
      set({ data, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar la analítica',
      })
    }
  },
}))
