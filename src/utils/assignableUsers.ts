import type { AppUser, Project, Puesto, Role } from '../types'
import { isProjectAssignee } from './projectUsers'
import { puestosDe } from './roleAccess'

export const ASSIGNABLE_ROLE_NAMES = ['Programador', 'Diseñador'] as const

export type AssignableRoleName = (typeof ASSIGNABLE_ROLE_NAMES)[number]

export function getRoleIdByName(roles: Role[], roleName: AssignableRoleName): number | undefined {
  return roles.find((role) => role.name === roleName)?.id
}

/** El puesto que corresponde a cada columna de los tableros. */
const PUESTO_DEL_TABLERO: Record<AssignableRoleName, Puesto> = {
  Programador: 'Desarrollo',
  Diseñador: 'Diseno',
}

/**
 * Quiénes trabajan en ese puesto. No se mira el rol directamente sino los
 * puestos de cada persona (que, sin nada cargado, salen de su rol): así un
 * programador que también diseña aparece en los dos tableros, y el Supervisor
 * sigue contando como desarrollador.
 */
export function getUsersByRoleName(
  users: AppUser[],
  roles: Role[],
  roleName: AssignableRoleName,
): AppUser[] {
  const nombrePorId = new Map(roles.map((role) => [role.id, role.name]))
  const puesto = PUESTO_DEL_TABLERO[roleName]
  return users.filter((user) =>
    puestosDe(nombrePorId.get(user.roleId), user.puestos).includes(puesto),
  )
}

/**
 * Deja fuera a quien ya no trabaja acá. Si todavía le quedaron proyectos
 * encima se le mantiene la columna, para que ese trabajo no desaparezca de
 * la vista hasta que alguien lo traspase.
 */
export function enElEquipo(
  users: AppUser[],
  projects: Project[],
  roleName: AssignableRoleName,
): AppUser[] {
  return users.filter(
    (user) =>
      user.active ||
      projects.some((project) => isProjectAssignee(project, roleName, user.id)),
  )
}

export function toSelectOptions(users: AppUser[]) {
  return users.map((user) => ({
    value: String(user.id),
    label: user.name,
  }))
}

export interface UserProjectCount {
  user: AppUser
  count: number
}

export function getActiveProjectCountsByRole(
  activeProjects: Project[],
  users: AppUser[],
  roles: Role[],
  roleName: AssignableRoleName,
): UserProjectCount[] {
  return getUsersByRoleName(users, roles, roleName)
    .map((user) => ({
      user,
      count: activeProjects.filter((project) =>
        isProjectAssignee(project, roleName, user.id),
      ).length,
    }))
    .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name, 'es'))
}
