export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectGroup {
  label: string
  options: MultiSelectOption[]
}

interface MultiSelectProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  error?: string
  emptyMessage?: string
  options?: MultiSelectOption[]
  groups?: MultiSelectGroup[]
}

export function MultiSelect({
  label,
  options = [],
  groups,
  value,
  onChange,
  error,
  emptyMessage = 'No hay opciones disponibles',
}: MultiSelectProps) {
  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const resolvedGroups = groups ?? (options.length > 0 ? [{ label: '', options }] : [])
  const hasOptions = resolvedGroups.some((group) => group.options.length > 0)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <div
        className={`max-h-52 overflow-y-auto rounded-lg border border-border bg-surface p-2 ${
          error ? 'border-red-500' : ''
        }`}
      >
        {!hasOptions ? (
          <p className="px-2 py-3 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {resolvedGroups.map((group) =>
              group.options.length === 0 ? null : (
                <div key={group.label}>
                  {group.label && (
                    <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {group.label}
                    </p>
                  )}
                  <ul className="space-y-1">
                    {group.options.map((option) => {
                      const checked = value.includes(option.value)
                      return (
                        <li key={option.value}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-overlay">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleValue(option.value)}
                              className="rounded border-border bg-surface-raised accent-accent"
                            />
                            <span className="text-sm text-slate-200">{option.label}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ),
            )}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-slate-500">{value.length} seleccionado(s)</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
