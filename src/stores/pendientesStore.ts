import { create } from 'zustand'
import type { Pendiente, ResumenPendientes } from '../types'
import {
  actualizarPendienteRequest,
  borrarPendienteRequest,
  crearPendienteRequest,
  getPendientesRequest,
  getResumenPendientesRequest,
} from '../services/api'

type Resultado = { success: boolean; error?: string }

/** La clave de una lista: proyecto y dueño. */
export const clavePendientes = (proyectoId: number, usuarioId: number) =>
  `${proyectoId}:${usuarioId}`

const mensajeDe = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

/** Primero lo que falta, en su orden; lo hecho al final. */
const ordenar = (lista: Pendiente[]) =>
  [...lista].sort((a, b) => Number(a.hecho) - Number(b.hecho) || a.orden - b.orden || a.id - b.id)

interface PendientesState {
  /** Contadores para las tarjetas, por `clavePendientes`. */
  resumen: Record<string, ResumenPendientes>
  /** Listas ya cargadas, por `clavePendientes`. */
  listas: Record<string, Pendiente[]>
  cargando: string | null
  fetchResumen: () => Promise<void>
  fetchLista: (proyectoId: number, usuarioId: number, esPropia: boolean) => Promise<Resultado>
  crear: (proyectoId: number, usuarioId: number, texto: string) => Promise<Resultado>
  actualizar: (
    pendiente: Pendiente,
    cambios: { texto?: string; hecho?: boolean },
  ) => Promise<Resultado>
  borrar: (pendiente: Pendiente) => Promise<Resultado>
}

export const usePendientesStore = create<PendientesState>((set, get) => {
  /** Guarda la lista y recalcula su contador. */
  const guardarLista = (proyectoId: number, usuarioId: number, lista: Pendiente[]) => {
    const clave = clavePendientes(proyectoId, usuarioId)
    set((state) => ({
      listas: { ...state.listas, [clave]: ordenar(lista) },
      resumen: {
        ...state.resumen,
        [clave]: {
          proyectoId,
          usuarioId,
          total: lista.length,
          hechos: lista.filter((p) => p.hecho).length,
        },
      },
    }))
  }

  return {
    resumen: {},
    listas: {},
    cargando: null,

    fetchResumen: async () => {
      try {
        const filas = await getResumenPendientesRequest()
        set({
          resumen: Object.fromEntries(
            filas.map((f) => [clavePendientes(f.proyectoId, f.usuarioId), f]),
          ),
        })
      } catch {
        // Sin contadores, las tarjetas se ven igual que antes.
      }
    },

    fetchLista: async (proyectoId, usuarioId, esPropia) => {
      const clave = clavePendientes(proyectoId, usuarioId)
      set({ cargando: clave })
      try {
        const lista = await getPendientesRequest(proyectoId, esPropia ? undefined : usuarioId)
        guardarLista(proyectoId, usuarioId, lista)
        set({ cargando: null })
        return { success: true }
      } catch (error) {
        set({ cargando: null })
        return { success: false, error: mensajeDe(error, 'No se pudieron cargar los pendientes') }
      }
    },

    crear: async (proyectoId, usuarioId, texto) => {
      try {
        const nuevo = await crearPendienteRequest(proyectoId, texto)
        const actual = get().listas[clavePendientes(proyectoId, usuarioId)] ?? []
        guardarLista(proyectoId, usuarioId, [...actual, nuevo])
        return { success: true }
      } catch (error) {
        return { success: false, error: mensajeDe(error, 'No se pudo agregar el pendiente') }
      }
    },

    actualizar: async (pendiente, cambios) => {
      const clave = clavePendientes(pendiente.proyectoId, pendiente.usuarioId)
      const antes = get().listas[clave] ?? []
      // Se marca al instante; si el API falla, se vuelve atrás.
      guardarLista(
        pendiente.proyectoId,
        pendiente.usuarioId,
        antes.map((p) => (p.id === pendiente.id ? { ...p, ...cambios } : p)),
      )
      try {
        const actualizado = await actualizarPendienteRequest(pendiente.id, cambios)
        guardarLista(
          pendiente.proyectoId,
          pendiente.usuarioId,
          (get().listas[clave] ?? []).map((p) => (p.id === pendiente.id ? actualizado : p)),
        )
        return { success: true }
      } catch (error) {
        guardarLista(pendiente.proyectoId, pendiente.usuarioId, antes)
        return { success: false, error: mensajeDe(error, 'No se pudo guardar el pendiente') }
      }
    },

    borrar: async (pendiente) => {
      const clave = clavePendientes(pendiente.proyectoId, pendiente.usuarioId)
      const antes = get().listas[clave] ?? []
      guardarLista(
        pendiente.proyectoId,
        pendiente.usuarioId,
        antes.filter((p) => p.id !== pendiente.id),
      )
      try {
        await borrarPendienteRequest(pendiente.id)
        return { success: true }
      } catch (error) {
        guardarLista(pendiente.proyectoId, pendiente.usuarioId, antes)
        return { success: false, error: mensajeDe(error, 'No se pudo borrar el pendiente') }
      }
    },
  }
})
