import type { Puesto } from '../types'

const PROGRAMADOR_HOME = '/proyectos/programador'
const DISENADOR_HOME = '/proyectos/diseno'
const ADMIN_HOME = '/'
const VISTA_GLOBAL = '/vista-global'

/**
 * Rutas que también ven los roles restringidos, además de la suya y Vista
 * Global: su vista de reuniones, el módulo para dejar notas, la bandeja de
 * notificaciones y su perfil.
 */
const RUTAS_COMPARTIDAS = [VISTA_GLOBAL, '/reuniones', '/notas', '/notificaciones', '/perfil']

export function getHomePathForRole(roleName: string | undefined): string {
  if (roleName === 'Programador') return PROGRAMADOR_HOME
  if (roleName === 'Diseñador') return DISENADOR_HOME
  return ADMIN_HOME
}

export function isRestrictedRole(roleName: string | undefined): boolean {
  return roleName === 'Programador' || roleName === 'Diseñador'
}

/**
 * Los mismos nombres que usa el backend en `ROLES_ADMINISTRACION`. El
 * Supervisor tiene los permisos de administración y además trabaja como
 * desarrollador.
 */
const ROLES_ADMINISTRACION = ['Admin', 'Owner', 'Supervisor']

/** Los que usan Google Workspace (@websy.com.pe) en vez del webmail de Ferozo. */
const ROLES_CON_WORKSPACE = ['Admin', 'Owner']

/**
 * ¿Tiene los permisos de administración? Se distingue por nombre y no por «no
 * restringido» para que un rol nuevo no herede el comportamiento sin querer.
 */
export function esAdministracion(roleName: string | undefined): boolean {
  return roleName !== undefined && ROLES_ADMINISTRACION.includes(roleName)
}

/**
 * ¿Usa el correo de Google Workspace? El Supervisor tiene permisos de
 * administración pero su correo es del equipo (@websydev.site).
 */
export function usaWorkspace(roleName: string | undefined): boolean {
  return roleName !== undefined && ROLES_CON_WORKSPACE.includes(roleName)
}

/** El Supervisor puede alternar entre sus proyectos y los de todos. */
export function esSupervisor(roleName: string | undefined): boolean {
  return roleName === 'Supervisor'
}

/** Los puestos que implica cada rol, cuando nadie cargó ninguno a mano. */
const PUESTO_DEL_ROL: Record<string, Puesto[]> = {
  Diseñador: ['Diseno'],
  Programador: ['Desarrollo'],
  Supervisor: ['Desarrollo'],
}

/**
 * En qué trabaja una persona: lo que administración le cargó o, si no tiene
 * nada, lo que implica su rol. Es la misma regla que aplica el API.
 */
export function puestosDe(
  roleName: string | undefined,
  puestos: Puesto[] | undefined,
): Puesto[] {
  if (puestos && puestos.length > 0) return puestos
  return PUESTO_DEL_ROL[roleName ?? ''] ?? []
}

function esPropiaOCompartida(
  roleName: string | undefined,
  path: string,
  puestos: Puesto[] | undefined,
): boolean {
  if (RUTAS_COMPARTIDAS.includes(path)) return true

  // El tablero se abre por puesto, no por rol: un programador que también
  // diseña entra a los dos.
  const suyos = puestosDe(roleName, puestos)
  if (path === PROGRAMADOR_HOME) return suyos.includes('Desarrollo')
  if (path === DISENADOR_HOME) return suyos.includes('Diseno')
  return !isRestrictedRole(roleName)
}

export function canAccessPath(
  roleName: string | undefined,
  pathname: string,
  puestos?: Puesto[],
): boolean {
  if (!isRestrictedRole(roleName)) return true

  const path = pathname.replace(/\/$/, '') || '/'
  return esPropiaOCompartida(roleName, path, puestos)
}

export function canAccessNavPath(
  roleName: string | undefined,
  navPath: string,
  puestos?: Puesto[],
): boolean {
  // Administración ve todo el menú; el resto, lo suyo y lo compartido.
  if (!isRestrictedRole(roleName)) return true

  return esPropiaOCompartida(roleName, navPath, puestos)
}
