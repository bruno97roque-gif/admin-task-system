export const TIPO_PROYECTO_VALUES = ['Informativa', 'Ecommerce', 'Sistema'] as const

export type TipoProyecto = (typeof TIPO_PROYECTO_VALUES)[number]

export const TIPO_PROYECTO_OPTIONS: { value: string; label: string }[] = [
  { value: 'Informativa', label: 'Web informativa' },
  { value: 'Ecommerce', label: 'E-commerce' },
  { value: 'Sistema', label: 'Sistema' },
]

export function getTipoProyectoLabel(value: string | null | undefined): string {
  if (value === 'Informativa') return 'Informativa'
  if (value === 'Ecommerce') return 'E-commerce'
  if (value === 'Sistema') return 'Sistema'
  return value ?? ''
}