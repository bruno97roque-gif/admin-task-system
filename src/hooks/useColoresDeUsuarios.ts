import { useMemo } from 'react'
import type { Project } from '../types'
import { useRolesStore } from '../stores/rolesStore'
import { useUsersStore } from '../stores/usersStore'
import { coloresDelEquipo } from '../utils/userColors'

const VACIO: Project[] = []

/** El color de cada persona del equipo, armado con los usuarios ya cargados. */
export function useColoresDeUsuarios(projects: Project[] = VACIO) {
  const users = useUsersStore((s) => s.users)
  const roles = useRolesStore((s) => s.roles)
  return useMemo(() => coloresDelEquipo(users, roles, projects), [users, roles, projects])
}
