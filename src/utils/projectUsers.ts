import type { AppUser, ProjectUsuarioAssignment } from '../types'

type ProjectUsuarioItem = ProjectUsuarioAssignment | AppUser

function extractUser(item: ProjectUsuarioItem): AppUser | null {
  if ('usuario' in item) {
    return item.usuario ?? null
  }

  if ('name' in item && 'id' in item) {
    return item
  }

  return null
}

export function getProjectUserNames(project: { usuarios: ProjectUsuarioItem[] }): string {
  if (!project.usuarios?.length) return 'Sin asignar'

  const names = project.usuarios
    .map(extractUser)
    .filter((user): user is AppUser => user !== null)
    .map((user) => user.name)

  return names.length > 0 ? names.join(', ') : 'Sin asignar'
}

export function getProjectUserIds(project: { usuarios: ProjectUsuarioItem[] }): number[] {
  if (!project.usuarios?.length) return []

  return project.usuarios
    .map(extractUser)
    .filter((user): user is AppUser => user !== null)
    .map((user) => user.id)
}
