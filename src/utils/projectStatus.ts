export const ESTADO_PROYECTO = {
  Registro: 'Registro',
  Brief: 'Brief',
  Taxonomia: 'Taxonomia',
  Diseno: 'Diseno',
  AvanceDiseno: 'AvanceDiseno',
  DisenoFinalizado: 'DisenoFinalizado',
  Desarrollo: 'Desarrollo',
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
  ProyectoFinalizado: 'Proyecto Finalizado',
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
  ProyectoFinalizado: 'bg-emerald-500/20 text-emerald-300',
  Archivado: 'bg-red-500/20 text-red-300',
}

export function estadoProyectoClass(estado: string): string {
  return ESTADO_PROYECTO_COLORS[estado] ?? 'bg-surface-overlay text-slate-300'
}