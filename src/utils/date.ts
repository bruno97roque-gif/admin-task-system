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
