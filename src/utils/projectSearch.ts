import type { Project } from '../types'
import { getProjectUserNames } from './projectUsers'
import { getTipoProyectoLabel } from './projectType'

export function getProjectSearchHaystack(
  project: Project,
  showTipoProyecto = true,
): string {
  return [
    project.name,
    project.descripcion,
    showTipoProyecto ? project.tipoProyecto : '',
    showTipoProyecto ? getTipoProyectoLabel(project.tipoProyecto) : '',
    getProjectUserNames(project),
    String(project.id),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function projectMatchesSearch(
  project: Project,
  query: string,
  showTipoProyecto = true,
): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return getProjectSearchHaystack(project, showTipoProyecto).includes(normalized)
}
