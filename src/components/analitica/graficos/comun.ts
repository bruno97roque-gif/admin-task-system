import { useCallback, useState } from 'react'
import type { IconType } from 'react-icons'
import {
  IoAddCircleOutline,
  IoArchiveOutline,
  IoCheckmarkCircleOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
} from 'react-icons/io5'

/**
 * Las cinco series del movimiento mensual. Los colores salieron del
 * validador de paletas (skill dataviz) contra el fondo `surface-raised`:
 * pasan la separación para daltonismo en el orden en que se apilan, así que
 * ese orden no se cambia sin volver a validar. El color sigue a la serie en
 * todos los gráficos y en la lista del mes.
 */
export type ClaveSerie = 'nuevos' | 'diseno' | 'desarrollo' | 'entregados' | 'archivados'

export const SERIES: Record<ClaveSerie, { nombre: string; color: string; icono: IconType }> = {
  nuevos: { nombre: 'Nuevos', color: '#d95926', icono: IoAddCircleOutline },
  diseno: { nombre: 'Diseño', color: '#9085e9', icono: IoColorPaletteOutline },
  desarrollo: { nombre: 'Desarrollo', color: '#199e70', icono: IoCodeSlashOutline },
  entregados: { nombre: 'Entregados', color: '#3987e5', icono: IoCheckmarkCircleOutline },
  archivados: { nombre: 'Archivados', color: '#c98500', icono: IoArchiveOutline },
}

export const ORDEN_SERIES: ClaveSerie[] = [
  'nuevos',
  'diseno',
  'desarrollo',
  'entregados',
  'archivados',
]

/**
 * Meta de días por etapa: la línea punteada de «Duración por etapa». Es un
 * número del equipo, no sale de los datos; se cambia acá.
 */
export const META_DIAS = { Diseno: 10, Desarrollo: 15 } as const

/** Desde cuántos días parado en su etapa un proyecto cuenta como estancado (igual que el API). */
export const DIAS_ESTANCADO = 15

/** Color de la línea de meta y de la rejilla: tinta, no una serie. */
export const COLOR_REJILLA = 'rgba(203, 190, 214, 0.14)'
export const COLOR_EJE = '#8f7c99'
export const COLOR_META = '#e7dcec'

/** `2026-09` → `Set 26`. */
export function mesCorto(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1)
    .toLocaleDateString('es-PE', { month: 'short' })
    .replace('.', '')
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${String(year).slice(2)}`
}

/** `2026-09` → `Septiembre 2026`. */
export function mesLargo(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-PE', { month: 'long' })
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${year}`
}

/** El mes calendario actual, `2026-09`. */
export function mesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

/** El mes anterior a `mes`. */
export function mesAnterior(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const fecha = new Date(year, month - 2, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

/** Los últimos `n` meses hasta `hasta` inclusive, del más viejo al más nuevo. */
export function ultimosMeses(n: number, hasta = mesActual()): string[] {
  const meses = [hasta]
  while (meses.length < n) meses.unshift(mesAnterior(meses[0]))
  return meses
}

/** Un tope «redondo» para el eje y sus marcas intermedias. */
export function escala(maximo: number, marcas = 4): { tope: number; ticks: number[] } {
  if (maximo <= 0) return { tope: marcas, ticks: Array.from({ length: marcas + 1 }, (_, i) => i) }
  const crudo = maximo / marcas
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= crudo) ?? crudo
  const pasoEntero = Math.max(1, Math.ceil(paso))
  const tope = pasoEntero * Math.ceil(maximo / pasoEntero)
  const ticks: number[] = []
  for (let v = 0; v <= tope; v += pasoEntero) ticks.push(v)
  return { tope, ticks }
}

/**
 * El ancho disponible de un contenedor. Se mide apenas se monta (así el
 * gráfico sale en el primer pintado) y después se siguen sus cambios.
 */
export function useAncho<T extends HTMLElement>() {
  const [ancho, setAncho] = useState(0)

  const ref = useCallback((el: T | null) => {
    if (!el) return
    setAncho(Math.floor(el.getBoundingClientRect().width))
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(Math.floor(entrada.contentRect.width))
    })
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return { ref, ancho }
}
