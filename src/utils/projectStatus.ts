export const ESTADO_PROYECTO_ORDER = [
  'Registro',
  'Brief',
  'Taxonomia',
  'Diseno',
  'Desarrollo',
  'ProyectoFinalizado',
] as const

export const ESTADO_PROYECTO_OPTIONS: { value: string; label: string }[] = [
  { value: 'Registro', label: 'Registro' },
  { value: 'Brief', label: 'Brief' },
  { value: 'Taxonomia', label: 'Taxonomía' },
  { value: 'Diseno', label: 'Diseño' },
  { value: 'Desarrollo', label: 'Desarrollo' },
  { value: 'ProyectoFinalizado', label: 'Proyecto Finalizado' },
]

export function getEstadoProyectoOptions(
  current: string,
  tipoProyecto: string | null,
): { value: string; label: string }[] {
  const index = ESTADO_PROYECTO_ORDER.indexOf(current as (typeof ESTADO_PROYECTO_ORDER)[number])
  if (index === -1) return ESTADO_PROYECTO_OPTIONS

  const legal = new Set<string>(ESTADO_PROYECTO_ORDER.slice(0, index + 1))
  const next = ESTADO_PROYECTO_ORDER[index + 1]
  if (next) legal.add(next)

  if (current === 'Brief' && tipoProyecto !== 'Ecommerce') {
    legal.add('Diseno')
  }

  return ESTADO_PROYECTO_OPTIONS.filter((option) => legal.has(option.value))
}