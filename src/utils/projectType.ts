export const TIPO_PROYECTO_VALUES = ['Informativa', 'Ecommerce'] as const

export type TipoProyecto = (typeof TIPO_PROYECTO_VALUES)[number]

export const TIPO_PROYECTO_OPTIONS: { value: string; label: string }[] = [
  { value: 'Informativa', label: 'Web informativa' },
  { value: 'Ecommerce', label: 'E-commerce' },
]

export function getTipoProyectoLabel(value: string | null | undefined): string {
  if (value === 'Informativa') return 'Web informativa'
  if (value === 'Ecommerce') return 'E-commerce'
  return value ?? ''
}