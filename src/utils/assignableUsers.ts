import type { AppUser, Project, Role } from '../types'
import { getProjectUserIds } from './projectUsers'

export const ASSIGNABLE_ROLE_NAMES = ['Programador', 'Diseñador'] as const

export type AssignableRoleName = (typeof ASSIGNABLE_ROLE_NAMES)[number]

export function getRoleIdByName(roles: Role[], roleName: AssignableRoleName): number | undefined {
  return roles.find((role) => role.name === roleName)?.id
}

export function getUsersByRoleName(
  users: AppUser[],
  roles: Role[],
  roleName: AssignableRoleName,
): AppUser[] {
  const roleId = getRoleIdByName(roles, roleName)
  if (!roleId) return []
  return users.filter((user) => user.roleId === roleId)
}

export function toSelectOptions(users: AppUser[]) {
  return users.map((user) => ({
    value: String(user.id),
    label: user.name,
  }))
}

export function splitUserIdsByRole(
  userIds: number[],
  roles: Role[],
  users: AppUser[],
): { programadorId: string; disenadorId: string } {
  const programadorRoleId = getRoleIdByName(roles, 'Programador')
  const disenadorRoleId = getRoleIdByName(roles, 'Diseñador')

  let programadorId = ''
  let disenadorId = ''

  userIds.forEach((id) => {
    const user = users.find((item) => item.id === id)
    if (!user) return

    if (user.roleId === programadorRoleId && !programadorId) {
      programadorId = String(id)
    } else if (user.roleId === disenadorRoleId && !disenadorId) {
      disenadorId = String(id)
    }
  })

  return { programadorId, disenadorId }
}

export function mergeUserIds(programadorId: string, disenadorId: string): number[] {
  return [programadorId, disenadorId].filter(Boolean).map(Number)
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
        getProjectUserIds(project).includes(user.id),
      ).length,
    }))
    .sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name, 'es'))
}
