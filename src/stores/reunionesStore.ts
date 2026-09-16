import { create } from 'zustand'
import type {
  EstadoDeGrabacion,
  EstadoGoogle,
  Reunion,
  SincronizacionGoogle,
} from '../types'
import type { ReunionRequest } from '../services/api'
import {
  conectarGoogleRequest,
  createReunionRequest,
  deleteReunionRequest,
  desconectarGoogleRequest,
  enviarAlCalendarRequest,
  getEstadoGoogleRequest,
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
  /** `null` mientras no se consultó (o para quien no es administración). */
  google: EstadoGoogle | null
  /** Id de la reunión que se está enviando al Calendar. */
  enviandoId: number | null
  /** `todas` es el listado de administración; sin eso trae solo las propias. */
  fetchReuniones: (todas: boolean) => Promise<void>
  createReunion: (data: ReunionRequest) => Promise<Resultado>
  updateReunion: (
    id: number,
    data: Partial<ReunionRequest>,
  ) => Promise<Resultado & { google?: SincronizacionGoogle }>
  deleteReunion: (id: number) => Promise<Resultado>
  enviarAlCalendar: (id: number) => Promise<Resultado & { grabacion?: EstadoDeGrabacion }>
  fetchEstadoGoogle: () => Promise<void>
  /** Pide la URL de Google; la página se encarga de llevar al navegador. */
  conectarGoogle: () => Promise<Resultado & { url?: string }>
  desconectarGoogle: () => Promise<Resultado>
}

function mensajeDe(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

const porFecha = (a: Reunion, b: Reunion) =>
  new Date(a.fecha).getTime() - new Date(b.fecha).getTime()

export const useReunionesStore = create<ReunionesState>((set) => ({
  reuniones: [],
  cargadoEn: 0,
  loading: false,
  saving: false,
  error: null,
  google: null,
  enviandoId: null,

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
        reuniones: [...state.reuniones, creada].sort(porFecha),
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
      const { google, ...actualizada } = await updateReunionRequest(id, data)
      set((state) => ({
        reuniones: state.reuniones
          .map((r) => (r.id === id ? actualizada : r))
          .sort(porFecha),
        saving: false,
      }))
      return { success: true, google }
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
      // No se deja en `error` de la página: el diálogo de confirmación lo muestra.
      return { success: false, error: mensajeDe(error, 'Error al eliminar la reunión') }
    }
  },

  enviarAlCalendar: async (id) => {
    set({ enviandoId: id, error: null })
    try {
      const { grabacion, ...enviada } = await enviarAlCalendarRequest(id)
      set((state) => ({
        reuniones: state.reuniones.map((r) => (r.id === id ? enviada : r)),
        enviandoId: null,
      }))
      return { success: true, grabacion }
    } catch (error) {
      set({ enviandoId: null })
      return { success: false, error: mensajeDe(error, 'No se pudo enviar al Calendar') }
    }
  },

  fetchEstadoGoogle: async () => {
    try {
      set({ google: await getEstadoGoogleRequest() })
    } catch {
      // Sin estado no se ofrece el envío: la página cae al flujo manual.
      set({ google: null })
    }
  },

  conectarGoogle: async () => {
    try {
      const { url } = await conectarGoogleRequest()
      return { success: true, url }
    } catch (error) {
      return { success: false, error: mensajeDe(error, 'No se pudo conectar Google') }
    }
  },

  desconectarGoogle: async () => {
    try {
      await desconectarGoogleRequest()
      set((state) => ({
        google: state.google && {
          ...state.google,
          conectada: false,
          cuenta: null,
          conectadaPor: null,
          conectadaAt: null,
          permisosFaltantes: [],
        },
      }))
      return { success: true }
    } catch (error) {
      return { success: false, error: mensajeDe(error, 'No se pudo desconectar Google') }
    }
  },
}))
