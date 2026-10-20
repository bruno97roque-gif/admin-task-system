import type { Project } from '../types'

const ESTADOS_CERRADOS = ['ProyectoFinalizado', 'Archivado']

/**
 * Los proyectos **activos** que una persona tiene a su cargo, separados por
 * puesto. Lo entregado y lo archivado no cuenta: ya no hay nada que traspasar.
 */
export function proyectosACargo(projects: Project[], usuarioId: number) {
  const activos = projects.filter((p) => !ESTADOS_CERRADOS.includes(p.estadoProyecto))
  return {
    diseno: activos.filter((p) => p.disenadorId === usuarioId),
    desarrollo: activos.filter((p) => p.desarrolladorId === usuarioId),
  }
}
