const PROGRAMADOR_HOME = '/proyectos/programador'
const DISENADOR_HOME = '/proyectos/diseno'
const ADMIN_HOME = '/'
const VISTA_GLOBAL = '/vista-global'

export function getHomePathForRole(roleName: string | undefined): string {
  if (roleName === 'Programador') return PROGRAMADOR_HOME
  if (roleName === 'Diseñador') return DISENADOR_HOME
  return ADMIN_HOME
}

export function isRestrictedRole(roleName: string | undefined): boolean {
  return roleName === 'Programador' || roleName === 'Diseñador'
}

/** Además de la suya, Programador y Diseñador también entran a Vista Global. */
function esPropiaOVistaGlobal(roleName: string | undefined, path: string): boolean {
  if (path === VISTA_GLOBAL) return true
  if (roleName === 'Programador') return path === PROGRAMADOR_HOME
  if (roleName === 'Diseñador') return path === DISENADOR_HOME
  return true
}

export function canAccessPath(roleName: string | undefined, pathname: string): boolean {
  if (!isRestrictedRole(roleName)) return true

  const path = pathname.replace(/\/$/, '') || '/'
  return esPropiaOVistaGlobal(roleName, path)
}

export function canAccessNavPath(roleName: string | undefined, navPath: string): boolean {
  if (!isRestrictedRole(roleName)) return true

  return esPropiaOVistaGlobal(roleName, navPath)
}
