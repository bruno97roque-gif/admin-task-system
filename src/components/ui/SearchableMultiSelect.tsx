import { useMemo, useState } from 'react'
import { IoClose, IoSearchOutline } from 'react-icons/io5'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableMultiSelectProps {
  label: string
  options: SearchableSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  emptyMessage?: string
}

export function SearchableMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'No hay resultados',
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedSet = useMemo(() => new Set(value), [value])

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet],
  )

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return options.filter((option) => {
      if (selectedSet.has(option.value)) return false
      if (!normalized) return true
      return option.label.toLowerCase().includes(normalized)
    })
  }, [options, query, selectedSet])

  const addOption = (optionValue: string) => {
    onChange([...value, optionValue])
    setQuery('')
    setOpen(true)
  }

  const removeOption = (optionValue: string) => {
    onChange(value.filter((id) => id !== optionValue))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>

      <div className="relative">
        <IoSearchOutline
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          size={16}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface-raised py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent"
        />

        {open && (
          <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-border bg-surface-raised shadow-lg">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-surface-overlay"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addOption(option.value)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-hover"
            >
              {option.label}
              <button
                type="button"
                onClick={() => removeOption(option.value)}
                className="rounded-full hover:text-white"
                aria-label={`Quitar ${option.label}`}
              >
                <IoClose size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
