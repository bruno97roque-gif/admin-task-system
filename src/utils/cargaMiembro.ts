import type { Project } from '../types'
import type { AssignableRoleName } from './assignableUsers'
import { isProjectAssignee } from './projectUsers'

/**
 * Los proyectos que una persona tiene **en su tramo**: los que está
 * trabajando y los que ya cerró y esperan al cliente. Los dos suman `total`.
 * Lo que está en otra etapa, archivado o entregado no cuenta acá.
 */
export interface CargaMiembro {
  total: number
  /** En su etapa: hoy el proyecto está en sus manos. */
  enCurso: number
  /** Cerró su parte y el proyecto espera al cliente (pago, materiales, revisión). */
  esperando: number
  /** De los que tiene en su etapa, cuántos están trabados por el cliente (Grupo B o C). */
  trabados: number
}

/** Las etapas en las que cada puesto está trabajando el proyecto. */
const ETAPAS_DE_TRABAJO: Record<AssignableRoleName, string[]> = {
  Programador: ['Desarrollo'],
  Diseñador: ['Diseno', 'AvanceDiseno'],
}

/** La etapa que marca que ese puesto ya terminó su parte. */
const ETAPA_TERMINADA: Record<AssignableRoleName, string> = {
  Programador: 'DesarrolloFinalizado',
  Diseñador: 'DisenoFinalizado',
}

export function cargaDeMiembro(
  activeProjects: Project[],
  roleName: AssignableRoleName,
  usuarioId: number,
): CargaMiembro {
  const suyos = activeProjects.filter((p) => isProjectAssignee(p, roleName, usuarioId))

  let enCurso = 0
  let esperando = 0
  let trabados = 0
  for (const proyecto of suyos) {
    if (ETAPAS_DE_TRABAJO[roleName].includes(proyecto.estadoProyecto)) {
      enCurso += 1
      // Grupo B o C: falta material, pago u hosting, así que no avanza
      // aunque la etapa sea suya.
      if (proyecto.grupo === 'B' || proyecto.grupo === 'C') trabados += 1
    } else if (proyecto.estadoProyecto === ETAPA_TERMINADA[roleName]) {
      esperando += 1
    }
  }

  return { total: enCurso + esperando, enCurso, esperando, trabados }
}
