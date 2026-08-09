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

export function getProjectUserNames(project: {
  usuarios: ProjectUsuarioItem[]
  desarrollador?: { name: string } | null
  disenador?: { name: string } | null
}): string {
  const team = (project.usuarios ?? [])
    .map(extractUser)
    .filter((user): user is AppUser => user !== null)
    .map((user) => user.name)

  const dedicated = [project.desarrollador?.name, project.disenador?.name].filter(
    (name): name is string => Boolean(name),
  )

  const names = [...new Set([...dedicated, ...team])]

  return names.length > 0 ? names.join(', ') : 'Sin asignar'
}

export function getProjectUserIds(project: { usuarios: ProjectUsuarioItem[] }): number[] {
  if (!project.usuarios?.length) return []

  return project.usuarios
    .map(extractUser)
    .filter((user): user is AppUser => user !== null)
    .map((user) => user.id)
}

export function isProjectAssignee(
  project: {
    usuarios: ProjectUsuarioItem[]
    desarrolladorId?: number | null
    disenadorId?: number | null
  },
  roleName: string,
  userId: number,
): boolean {
  if (getProjectUserIds(project).includes(userId)) return true
  if (roleName === 'Programador') return project.desarrolladorId === userId
  if (roleName === 'Diseñador') return project.disenadorId === userId
  return false
}