import type { AppUser, AuthUser } from '../types'

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function authUserToAppUser(user: AuthUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    user: user.user,
    roleId: user.roleId,
    active: true,
  }
}
