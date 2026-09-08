const PROGRAMADOR_HOME = '/proyectos/programador'
const DISENADOR_HOME = '/proyectos/diseno'
const ADMIN_HOME = '/'
const VISTA_GLOBAL = '/vista-global'

/**
 * Rutas que también ven los roles restringidos, además de la suya y Vista
 * Global: su vista de reuniones, el módulo para dejar notas y la bandeja
 * de notificaciones.
 */
const RUTAS_COMPARTIDAS = [VISTA_GLOBAL, '/reuniones', '/notas', '/notificaciones']

export function getHomePathForRole(roleName: string | undefined): string {
  if (roleName === 'Programador') return PROGRAMADOR_HOME
  if (roleName === 'Diseñador') return DISENADOR_HOME
  return ADMIN_HOME
}

export function isRestrictedRole(roleName: string | undefined): boolean {
  return roleName === 'Programador' || roleName === 'Diseñador'
}

function esPropiaOCompartida(roleName: string | undefined, path: string): boolean {
  if (RUTAS_COMPARTIDAS.includes(path)) return true
  if (roleName === 'Programador') return path === PROGRAMADOR_HOME
  if (roleName === 'Diseñador') return path === DISENADOR_HOME
  return true
}

export function canAccessPath(roleName: string | undefined, pathname: string): boolean {
  if (!isRestrictedRole(roleName)) return true

  const path = pathname.replace(/\/$/, '') || '/'
  return esPropiaOCompartida(roleName, path)
}

export function canAccessNavPath(roleName: string | undefined, navPath: string): boolean {
  if (!isRestrictedRole(roleName)) return true

  return esPropiaOCompartida(roleName, navPath)
}
