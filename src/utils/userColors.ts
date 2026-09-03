interface UserColor {
  hex: string
  label: string
}

// Asignación manual: cada diseñador/desarrollador tiene un color fijo para
// identificarlo de un vistazo en Vista Global.
const USER_COLOR_BY_ID: Record<number, UserColor> = {
  13: { hex: '#ef4444', label: 'Juan Carlos' }, // rojo
  16: { hex: '#3b82f6', label: 'Gustavo' }, // azul
  12: { hex: '#f18c1b', label: 'Luis' }, // naranja
  14: { hex: '#22d3ee', label: 'Rubid' }, // celeste
  11: { hex: '#22c55e', label: 'Aaron' }, // verde
}

export const DISENADOR_COLORS: number[] = [13, 16]
export const DESARROLLADOR_COLORS: number[] = [12, 14, 11]

export function getUserColor(userId: number | null | undefined): UserColor | null {
  if (userId == null) return null
  return USER_COLOR_BY_ID[userId] ?? null
}
