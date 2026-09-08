import { useCallback, useEffect, useRef, useState } from 'react'
import type { Notificacion } from '../types'
import { useNotificacionesStore } from '../stores/notificacionesStore'
import {
  playAlertSound,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from '../utils/alerts'

const POLL_INTERVAL_MS = 30 * 1000

interface Nuevas {
  usuarioId: number | undefined
  items: Notificacion[]
}

/**
 * Consulta la bandeja cada 30 segundos y avisa (modal, sonido y notificación
 * del navegador) cuando aparece una notificación no leída que esta sesión
 * todavía no vio. En la primera carga, todas las no leídas cuentan como nuevas.
 */
export function useNotificaciones(usuarioId: number | undefined) {
  const fetchNotificaciones = useNotificacionesStore((s) => s.fetchNotificaciones)
  const noLeidas = useNotificacionesStore((s) => s.noLeidas)
  const reset = useNotificacionesStore((s) => s.reset)

  // Se guardan junto con el usuario para que un cambio de sesión no arrastre
  // las novedades del anterior, sin tener que limpiarlas desde el efecto.
  const [nuevas, setNuevas] = useState<Nuevas>({ usuarioId: undefined, items: [] })
  const vistasRef = useRef<Set<number> | null>(null)

  useEffect(() => {
    if (usuarioId === undefined) return

    vistasRef.current = null
    reset()
    requestBrowserNotificationPermission()

    let cancelado = false

    const avisar = (items: Notificacion[]) => {
      if (items.length === 0) return
      setNuevas((prev) => {
        const previas = prev.usuarioId === usuarioId ? prev.items : []
        const ids = new Set(previas.map((n) => n.id))
        return { usuarioId, items: [...items.filter((n) => !ids.has(n.id)), ...previas] }
      })
      playAlertSound()
      items.forEach((n) =>
        showBrowserNotification(n.titulo, n.mensaje, `notificacion-${n.id}`),
      )
    }

    const consultar = async () => {
      const lista = await fetchNotificaciones()
      if (cancelado) return

      const pendientes = lista.filter((n) => !n.leidaAt)

      if (vistasRef.current === null) {
        vistasRef.current = new Set(lista.map((n) => n.id))
        avisar(pendientes)
        return
      }

      const vistas = vistasRef.current
      const recientes = pendientes.filter((n) => !vistas.has(n.id))
      lista.forEach((n) => vistas.add(n.id))
      avisar(recientes)
    }

    consultar()
    const interval = setInterval(consultar, POLL_INTERVAL_MS)

    return () => {
      cancelado = true
      clearInterval(interval)
    }
  }, [usuarioId, fetchNotificaciones, reset])

  const descartarNuevas = useCallback(
    () => setNuevas({ usuarioId, items: [] }),
    [usuarioId],
  )

  return {
    nuevas: nuevas.usuarioId === usuarioId ? nuevas.items : [],
    descartarNuevas,
    noLeidas,
  }
}
