import type { AppUser, Role } from '../types'

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
): { programadoresIds: string[]; disenadoresIds: string[] } {
  const programadorRoleId = getRoleIdByName(roles, 'Programador')
  const disenadorRoleId = getRoleIdByName(roles, 'Diseñador')

  const programadoresIds: string[] = []
  const disenadoresIds: string[] = []

  userIds.forEach((id) => {
    const user = users.find((item) => item.id === id)
    if (!user) return

    if (user.roleId === programadorRoleId) {
      programadoresIds.push(String(id))
    } else if (user.roleId === disenadorRoleId) {
      disenadoresIds.push(String(id))
    }
  })

  return { programadoresIds, disenadoresIds }
}

export function mergeUserIds(programadoresIds: string[], disenadoresIds: string[]): number[] {
  return [...programadoresIds, ...disenadoresIds].map(Number)
}
