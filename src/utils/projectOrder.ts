import type { Project } from '../types'

const STORAGE_PREFIX = 'project-order:'

export type OrderMode = 'personalizado' | 'antiguo' | 'nuevo' | 'alfabetico'

export const ORDER_MODE_OPTIONS: { value: OrderMode; label: string }[] = [
  { value: 'personalizado', label: 'Personalizado (arrastrar)' },
  { value: 'antiguo', label: 'Más antiguo primero' },
  { value: 'nuevo', label: 'Más nuevo primero' },
  { value: 'alfabetico', label: 'Alfabético (A-Z)' },
]

export function sortProjectsByMode<T extends Pick<Project, 'name' | 'createdAt'>>(
  projects: T[],
  mode: OrderMode,
): T[] {
  if (mode === 'antiguo') {
    return [...projects].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }
  if (mode === 'nuevo') {
    return [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  if (mode === 'alfabetico') {
    return [...projects].sort((a, b) =>
      getSortableName(a.name).localeCompare(getSortableName(b.name), 'es'),
    )
  }
  return projects
}

/** Los nombres suelen llevar un código adelante ("019 - Urban"): para ordenar
 * alfabéticamente hay que arrancar por el nombre, no por el código. */
function getSortableName(name: string): string {
  return name.replace(/^\s*\d+\s*[-–—]?\s*/, '')
}

export function getStoredOrder(key: string): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : []
  } catch {
    return []
  }
}

export function setStoredOrder(key: string, order: number[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(order))
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — se ignora
  }
}

/** Agrega ids nuevos al final y descarta los que ya no existen. */
export function reconcileOrder(order: number[], currentIds: number[]): number[] {
  const currentSet = new Set(currentIds)
  const kept = order.filter((id) => currentSet.has(id))
  const known = new Set(kept)
  const added = currentIds.filter((id) => !known.has(id))
  return [...kept, ...added]
}

export function sortByOrder<T extends { id: number }>(items: T[], order: number[]): T[] {
  const index = new Map(order.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (index.get(a.id) ?? Infinity) - (index.get(b.id) ?? Infinity))
}

/**
 * Reinserta el nuevo orden de un subconjunto visible (p. ej. tras un filtro)
 * dentro del orden completo, sin mover los ids que quedaron ocultos.
 */
export function mergeVisibleOrder(
  fullOrder: number[],
  visibleIdsOld: number[],
  visibleIdsNew: number[],
): number[] {
  const visibleSet = new Set(visibleIdsOld)
  let cursor = 0
  return fullOrder.map((id) => (visibleSet.has(id) ? visibleIdsNew[cursor++] : id))
}
