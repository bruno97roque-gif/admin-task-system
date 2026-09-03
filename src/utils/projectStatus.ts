export const ESTADO_PROYECTO = {
  Registro: 'Registro',
  Brief: 'Brief',
  Taxonomia: 'Taxonomia',
  Diseno: 'Diseno',
  AvanceDiseno: 'AvanceDiseno',
  DisenoFinalizado: 'DisenoFinalizado',
  Desarrollo: 'Desarrollo',
  DesarrolloFinalizado: 'DesarrolloFinalizado',
  ProyectoFinalizado: 'ProyectoFinalizado',
  Archivado: 'Archivado',
} as const

export type EstadoProyecto = (typeof ESTADO_PROYECTO)[keyof typeof ESTADO_PROYECTO]

export const ESTADO_PROYECTO_ORDER: EstadoProyecto[] = [
  'Registro',
  'Brief',
  'Taxonomia',
  'Diseno',
  'AvanceDiseno',
  'DisenoFinalizado',
  'Desarrollo',
  'DesarrolloFinalizado',
  'ProyectoFinalizado',
]

/** Etiquetas para mostrar. El valor del JSON no lleva ñ ni espacios. */
export const ETIQUETA_ESTADO: Record<EstadoProyecto, string> = {
  Registro: 'Registro',
  Brief: 'Brief',
  Taxonomia: 'Taxonomía',
  Diseno: 'Diseño',
  AvanceDiseno: 'Avance de Diseño',
  DisenoFinalizado: 'Diseño Finalizado',
  Desarrollo: 'Desarrollo',
  DesarrolloFinalizado: 'Desarrollo Finalizado',
  ProyectoFinalizado: 'Finalizado',
  Archivado: 'Archivado',
}

export function getEstadoProyectoLabel(value: string): string {
  return ETIQUETA_ESTADO[value as EstadoProyecto] ?? value
}

export const ESTADO_PROYECTO_OPTIONS: { value: string; label: string }[] =
  ESTADO_PROYECTO_ORDER.map((value) => ({ value, label: ETIQUETA_ESTADO[value] }))

/** El tramo de diseño. Usar esto en vez de comparar contra 'Diseno' solo. */
export const ETAPAS_DISENO: EstadoProyecto[] = ['Diseno', 'AvanceDiseno', 'DisenoFinalizado']

export const esEtapaDeDiseno = (estado: EstadoProyecto) => ETAPAS_DISENO.includes(estado)

/**
 * Las etapas a las que la API va a dejar mover el proyecto: la siguiente y
 * todas las anteriores. Sirve para armar el `<select>` sin comerse un 409.
 *
 * No contempla las dos excepciones por tipo de proyecto; si el proyecto es
 * informativo o e-commerce, filtrar `Taxonomia` según corresponda.
 */
export function etapasPermitidas(actual: EstadoProyecto): EstadoProyecto[] {
  const i = ESTADO_PROYECTO_ORDER.indexOf(actual)
  if (i === -1) return [] // Archivado: solo se sale por POST /:id/reactivar
  return ESTADO_PROYECTO_ORDER.slice(0, i + 2)
}

export function getEstadoProyectoOptions(
  current: string,
  tipoProyecto: string | null,
): { value: string; label: string }[] {
  const legal = new Set<string>(etapasPermitidas(current as EstadoProyecto))
  if (legal.size === 0) return ESTADO_PROYECTO_OPTIONS

  if (current === 'Brief' && tipoProyecto !== 'Ecommerce') {
    legal.add('Diseno')
  }

  return ESTADO_PROYECTO_OPTIONS.filter((option) => legal.has(option.value))
}

export const ESTADO_PROYECTO_COLORS: Record<string, string> = {
  Registro: 'bg-slate-500/20 text-slate-300',
  Brief: 'bg-blue-500/20 text-blue-300',
  Taxonomia: 'bg-indigo-500/20 text-indigo-300',
  Diseno: 'bg-purple-500/20 text-purple-300',
  AvanceDiseno: 'bg-fuchsia-500/20 text-fuchsia-300',
  DisenoFinalizado: 'bg-cyan-500/20 text-cyan-300',
  Desarrollo: 'bg-amber-500/20 text-amber-300',
  Desarollo: 'bg-amber-500/20 text-amber-300',
  DesarrolloFinalizado: 'bg-teal-500/20 text-teal-300',
  ProyectoFinalizado: 'bg-emerald-500/20 text-emerald-300',
  Archivado: 'bg-red-500/20 text-red-300',
}

export function estadoProyectoClass(estado: string): string {
  return ESTADO_PROYECTO_COLORS[estado] ?? 'bg-surface-overlay text-slate-300'
}

/**
 * Orden "por defecto" de las listas y tableros: no es el orden del flujo,
 * es el que más sirve para revisar el día a día — lo más activo primero
 * (Desarrollo, luego Diseño), lo más temprano al final de lo activo, y los
 * "Finalizado" siempre al fondo del todo.
 */
export const ESTADO_PROYECTO_JERARQUIA: EstadoProyecto[] = [
  'Desarrollo',
  'Diseno',
  'AvanceDiseno',
  'Brief',
  'Taxonomia',
  'Registro',
  'ProyectoFinalizado',
  'DesarrolloFinalizado',
  'DisenoFinalizado',
  'Archivado',
]

function jerarquiaIndex(estado: string): number {
  const i = ESTADO_PROYECTO_JERARQUIA.indexOf(
    estado === 'Desarollo' ? 'Desarrollo' : (estado as EstadoProyecto),
  )
  return i === -1 ? ESTADO_PROYECTO_JERARQUIA.length : i
}

export function sortPorJerarquia<T extends { estadoProyecto: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => jerarquiaIndex(a.estadoProyecto) - jerarquiaIndex(b.estadoProyecto),
  )
}