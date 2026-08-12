import { useMemo, useState } from 'react'
import { IoFolderOpenOutline, IoSearchOutline } from 'react-icons/io5'
import type { Project } from '../../types'
import { projectMatchesSearch } from '../../utils/projectSearch'
import { getEstadoProyectoLabel } from '../../utils/projectStatus'

interface ProjectSearchInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  projects: Project[]
  showTipoProyecto?: boolean
  maxSuggestions?: number
}

export function ProjectSearchInput({
  label = 'Buscar',
  placeholder = 'Nombre, descripción, usuarios...',
  value,
  onChange,
  projects,
  showTipoProyecto = true,
  maxSuggestions = 10,
}: ProjectSearchInputProps) {
  const [open, setOpen] = useState(false)
  const inputId = 'project-search-input'

  const suggestions = useMemo(() => {
    const query = value.trim()
    if (!query) return []

    return projects
      .filter((project) => projectMatchesSearch(project, query, showTipoProyecto))
      .slice(0, maxSuggestions)
  }, [projects, value, showTipoProyecto, maxSuggestions])

  const showDropdown = open && value.trim() !== ''

  const handleSelect = (project: Project) => {
    onChange(project.name)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        <IoSearchOutline
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-slate-500"
          size={16}
        />
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="project-search-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface-raised py-2 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-1 focus:ring-accent"
        />

        {showDropdown && (
          <ul
            id="project-search-suggestions"
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-surface-raised shadow-lg"
          >
            {suggestions.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-slate-500">
                No hay proyectos que coincidan
              </li>
            ) : (
              suggestions.map((project) => (
                <li key={project.id} role="option">
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-overlay"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(project)}
                  >
                    <IoFolderOpenOutline
                      className="mt-0.5 shrink-0 text-accent"
                      size={16}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {project.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        Grupo {project.grupo} · {getEstadoProyectoLabel(project.estadoProyecto)}
                        {project.descripcion ? ` · ${project.descripcion}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
