export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function formatDateDisplay(value: string | null | undefined): string {
  const iso = toDateInputValue(value)
  if (!iso) return ''

  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''

  return `${day}/${month}/${year}`
}

export function formatDateTimeDisplay(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** ISO (UTC) → valor de `<input type="datetime-local">` en hora local. */
export function toDateTimeInputValue(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** «hace 5 min», «hace 3 h», «ayer», o la fecha si es más viejo. */
export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'recién'
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.round(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`

  return formatDateDisplay(date.toISOString())
}
