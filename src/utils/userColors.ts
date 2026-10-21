import type { AppUser, Project, Puesto, Role } from '../types'
import { isProjectAssignee } from './projectUsers'
import { puestosDe } from './roleAccess'

export interface UserColor {
  hex: string
  label: string
}

// Los colores de siempre: la gente que ya estaba conserva el suyo para no
// tener que reaprender de quién es cada punto.
const COLOR_FIJO: Record<number, UserColor> = {
  13: { hex: '#ef4444', label: 'Juan Carlos' }, // rojo
  16: { hex: '#3b82f6', label: 'Gustavo' }, // azul
  12: { hex: '#f97316', label: 'Luis' }, // naranja
  14: { hex: '#fde047', label: 'Rubid' }, // amarillo claro
  11: { hex: '#22c55e', label: 'Aaron' }, // verde
}

// Para quien entre después: se reparten en orden de ingreso y ninguno
// repite los de arriba.
const PALETA = [
  '#a78bfa', // violeta
  '#ec4899', // rosa
  '#2dd4bf', // turquesa
  '#f59e0b', // ámbar
  '#60a5fa', // celeste
  '#84cc16', // lima
  '#c084fc', // lavanda
  '#fb7185', // coral
]

export interface ColoresDelEquipo {
  /** El color de una persona, aunque ya no trabaje acá. */
  colorDe: (userId: number | null | undefined) => UserColor | null
  /** Quiénes diseñan hoy, para la leyenda. */
  disenadores: number[]
  /** Quiénes desarrollan hoy, para la leyenda. */
  desarrolladores: number[]
}

/** «Aaron Jauregui» es «Aaron», salvo que haya dos Aaron en el equipo. */
function etiquetas(users: AppUser[]): Map<number, string> {
  const cuantos = new Map<string, number>()
  for (const user of users) {
    const pila = user.name.trim().split(/\s+/)[0] ?? user.name
    cuantos.set(pila, (cuantos.get(pila) ?? 0) + 1)
  }
  return new Map(
    users.map((user) => {
      const pila = user.name.trim().split(/\s+/)[0] ?? user.name
      return [user.id, (cuantos.get(pila) ?? 0) > 1 ? user.name : pila]
    }),
  )
}

/**
 * Reparte un color por persona del equipo. Los que ya tenían uno asignado a
 * mano lo mantienen y el resto saca de la paleta, así quien entra nuevo
 * aparece con su punto sin que haya que tocar código.
 */
export function coloresDelEquipo(
  users: AppUser[],
  roles: Role[],
  /** Lo que hay a la vista: quien se fue pero sigue con proyectos acá se
   *  queda en la leyenda, porque sus puntos siguen apareciendo. */
  projects: Project[] = [],
): ColoresDelEquipo {
  const nombreDelRol = new Map(roles.map((role) => [role.id, role.name]))
  const puestosDeUsuario = (user: AppUser) =>
    puestosDe(nombreDelRol.get(user.roleId), user.puestos)

  const equipo = users
    .filter((user) => puestosDeUsuario(user).length > 0)
    .sort((a, b) => a.id - b.id)
  const nombres = etiquetas(equipo)

  const colores = new Map<number, UserColor>()
  for (const user of equipo) {
    const fijo = COLOR_FIJO[user.id]
    if (fijo) colores.set(user.id, fijo)
  }
  let siguiente = 0
  for (const user of equipo) {
    if (colores.has(user.id)) continue
    colores.set(user.id, {
      hex: PALETA[siguiente % PALETA.length],
      label: nombres.get(user.id) ?? user.name,
    })
    siguiente++
  }

  const trabajanEn = (puesto: Puesto) => {
    const roleName = puesto === 'Diseno' ? 'Diseñador' : 'Programador'
    return equipo
      .filter(
        (user) =>
          puestosDeUsuario(user).includes(puesto) &&
          (user.active ||
            projects.some((project) => isProjectAssignee(project, roleName, user.id))),
      )
      .map((user) => user.id)
  }

  return {
    colorDe: (userId) => (userId == null ? null : (colores.get(userId) ?? null)),
    disenadores: trabajanEn('Diseno'),
    desarrolladores: trabajanEn('Desarrollo'),
  }
}
