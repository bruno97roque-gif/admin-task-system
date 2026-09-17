import type { AppUser, Project, Role } from '../types'
import { isProjectAssignee } from './projectUsers'

export const ASSIGNABLE_ROLE_NAMES = ['Programador', 'Diseñador'] as const

export type AssignableRoleName = (typeof ASSIGNABLE_ROLE_NAMES)[number]

export function getRoleIdByName(roles: Role[], roleName: AssignableRoleName): number | undefined {
  return roles.find((role) => role.name === roleName)?.id
}

/**
 * Roles que cuentan como cada puesto. El Supervisor tiene permisos de
 * administración pero sigue trabajando como desarrollador: aparece en el
 * tablero de Developers y se le pueden asignar proyectos.
 */
const ROLES_DEL_PUESTO: Record<AssignableRoleName, string[]> = {
  Programador: ['Programador', 'Supervisor'],
  Diseñador: ['Diseñador'],
}

export function getUsersByRoleName(
  users: AppUser[],
  roles: Role[],
  roleName: AssignableRoleName,
): AppUser[] {
  const roleIds = new Set(
    roles.filter((role) => ROLES_DEL_PUESTO[roleName].includes(role.name)).map((role) => role.id),
  )
  return users.filter((user) => roleIds.has(user.roleId))
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
