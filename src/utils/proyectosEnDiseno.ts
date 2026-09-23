import type { Project } from '../types'
import { ETAPAS_DISENO } from './projectStatus'

/**
 * Los proyectos que todavía están en diseño: van a caer en el tablero de
 * desarrollo cuando el diseño se cierre. Primero los más avanzados (Diseño
 * Finalizado arriba), que son los que están por pasar.
 */
export function proyectosEnDiseno(projects: Project[]): Project[] {
  return projects
    .filter((p) => ETAPAS_DISENO.includes(p.estadoProyecto as never))
    .sort(
      (a, b) =>
        ETAPAS_DISENO.indexOf(b.estadoProyecto as never) -
          ETAPAS_DISENO.indexOf(a.estadoProyecto as never) ||
        a.name.localeCompare(b.name, 'es'),
    )
}
