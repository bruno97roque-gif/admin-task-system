import { create } from 'zustand'
import type { Comunicado, ComunicadoAdmin } from '../types'
import type { ComunicadoRequest } from '../services/api'
import {
  cerrarComunicadoRequest,
  createComunicadoRequest,
  deleteComunicadoRequest,
  finalizarComunicadoRequest,
  getComunicadosActivosRequest,
  getComunicadosLoginRequest,
  getComunicadosRequest,
  updateComunicadoRequest,
} from '../services/api'

type Resultado = { success: boolean; error?: string }

const mensajeDe = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

/** Primero lo que se está mostrando, después lo programado y al final lo terminado. */
const RANGO: Record<ComunicadoAdmin['estado'], number> = { vigente: 0, programado: 1, finalizado: 2 }

const porInicio = (a: ComunicadoAdmin, b: ComunicadoAdmin) =>
  RANGO[a.estado] - RANGO[b.estado] ||
  new Date(b.desde).getTime() - new Date(a.desde).getTime()

interface ComunicadosState {
  /** Los de la página de login (sin sesión). */
  login: Comunicado[]
  /** Los pendientes del usuario dentro del sistema. */
  activos: Comunicado[]
  cerrandoId: number | null
  /** Todos, para la pantalla de administración. */
  todos: ComunicadoAdmin[]
  cargando: boolean
  error: string | null

  fetchLogin: () => Promise<void>
  fetchActivos: () => Promise<void>
  cerrar: (id: number) => Promise<void>
  fetchTodos: () => Promise<void>
  guardar: (id: number | null, data: ComunicadoRequest) => Promise<Resultado>
  finalizar: (id: number) => Promise<Resultado>
  eliminar: (id: number) => Promise<Resultado>
}

export const useComunicadosStore = create<ComunicadosState>((set, get) => {
  /**
   * Mete o reemplaza uno en la lista de administración, y refresca los avisos
   * de arriba para que quien publica vea el cambio al instante.
   */
  const poner = (c: ComunicadoAdmin) => {
    set((state) => ({
      todos: [...state.todos.filter((x) => x.id !== c.id), c].sort(porInicio),
    }))
    void get().fetchActivos()
  }

  return {
    login: [],
    activos: [],
    cerrandoId: null,
    todos: [],
    cargando: false,
    error: null,

    fetchLogin: async () => {
      try {
        set({ login: await getComunicadosLoginRequest() })
      } catch {
        // Sin comunicados el login funciona igual.
      }
    },

    fetchActivos: async () => {
      try {
        set({ activos: await getComunicadosActivosRequest() })
      } catch {
        // Un aviso que no carga no debe romper la página: se reintenta luego.
      }
    },

    cerrar: async (id) => {
      set({ cerrandoId: id })
      try {
        await cerrarComunicadoRequest(id)
        set((state) => ({ activos: state.activos.filter((c) => c.id !== id) }))
      } catch {
        // Si falla, queda visible y se puede volver a intentar.
      } finally {
        set({ cerrandoId: null })
      }
    },

    fetchTodos: async () => {
      set({ cargando: true, error: null })
      try {
        set({ todos: (await getComunicadosRequest()).sort(porInicio), cargando: false })
      } catch (error) {
        set({ cargando: false, error: mensajeDe(error, 'No se pudieron cargar los comunicados') })
      }
    },

    guardar: async (id, data) => {
      try {
        if (id === null) {
          poner(await createComunicadoRequest(data))
        } else {
          // `notificar` es solo para publicar: al editar no se manda.
          poner(
            await updateComunicadoRequest(id, {
              titulo: data.titulo,
              mensaje: data.mensaje,
              nivel: data.nivel,
              enLogin: data.enLogin,
              enSistema: data.enSistema,
              desde: data.desde,
              hasta: data.hasta,
            }),
          )
        }
        return { success: true }
      } catch (error) {
        return { success: false, error: mensajeDe(error, 'No se pudo guardar el comunicado') }
      }
    },

    finalizar: async (id) => {
      try {
        poner(await finalizarComunicadoRequest(id))
        return { success: true }
      } catch (error) {
        return { success: false, error: mensajeDe(error, 'No se pudo finalizar') }
      }
    },

    eliminar: async (id) => {
      try {
        await deleteComunicadoRequest(id)
        set((state) => ({ todos: state.todos.filter((c) => c.id !== id) }))
        void get().fetchActivos()
        return { success: true }
      } catch (error) {
        return { success: false, error: mensajeDe(error, 'No se pudo eliminar') }
      }
    },
  }
})
