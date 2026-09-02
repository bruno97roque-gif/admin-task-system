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
