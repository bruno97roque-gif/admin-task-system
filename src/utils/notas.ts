import type { CategoriaNota, EstadoNota } from '../types'

export const CATEGORIA_OPTIONS: { value: CategoriaNota; label: string }[] = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Bloqueo', label: 'Bloqueo' },
  { value: 'Material', label: 'Falta material' },
  { value: 'Cambio', label: 'Pedido de cambio' },
  { value: 'Otro', label: 'Otro' },
]

export const ESTADO_OPTIONS: { value: EstadoNota; label: string }[] = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'EnCurso', label: 'En curso' },
  { value: 'Resuelta', label: 'Resuelto' },
]

const ETIQUETA_CATEGORIA: Record<CategoriaNota, string> = {
  Consulta: 'Consulta',
  Bloqueo: 'Bloqueo',
  Material: 'Falta material',
  Cambio: 'Pedido de cambio',
  Otro: 'Otro',
}

const ETIQUETA_ESTADO: Record<EstadoNota, string> = {
  Pendiente: 'Pendiente',
  EnCurso: 'En curso',
  Resuelta: 'Resuelto',
}

/** Un bloqueo salta a la vista; lo resuelto se apaga. */
const COLOR_CATEGORIA: Record<CategoriaNota, string> = {
  Consulta: 'bg-sky-500/20 text-sky-300',
  Bloqueo: 'bg-red-500/20 text-red-300',
  Material: 'bg-amber-500/20 text-amber-300',
  Cambio: 'bg-fuchsia-500/20 text-fuchsia-300',
  Otro: 'bg-surface-overlay text-slate-300',
}

const COLOR_ESTADO: Record<EstadoNota, string> = {
  Pendiente: 'bg-amber-500/20 text-amber-300',
  EnCurso: 'bg-sky-500/20 text-sky-300',
  Resuelta: 'bg-emerald-500/20 text-emerald-400',
}

export const etiquetaCategoria = (c: CategoriaNota) => ETIQUETA_CATEGORIA[c] ?? c
export const etiquetaEstado = (e: EstadoNota) => ETIQUETA_ESTADO[e] ?? e
export const colorCategoria = (c: CategoriaNota) =>
  COLOR_CATEGORIA[c] ?? 'bg-surface-overlay text-slate-300'
export const colorEstado = (e: EstadoNota) =>
  COLOR_ESTADO[e] ?? 'bg-surface-overlay text-slate-300'
