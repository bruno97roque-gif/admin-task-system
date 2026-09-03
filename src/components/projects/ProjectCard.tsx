import { IoCashOutline, IoPeopleOutline } from 'react-icons/io5'
import type { AppUser, Project } from '../../types'
import { extractUser } from '../../utils/projectUsers'
import { estadoProyectoClass, getEstadoProyectoLabel } from '../../utils/projectStatus'
import { getTipoProyectoLabel } from '../../utils/projectType'
import { grupoBadgeClass } from '../../utils/grupoColor'
import { TecnologiaIcon } from './TecnologiaIcon'
import { TipoProyectoIcon } from './TipoProyectoIcon'

export function ProjectCard({
  project,
  columnUserId,
  onSelect,
}: {
  project: Project
  columnUserId: number
  onSelect?: (project: Project) => void
}) {
  const otrosUsuarios = project.usuarios
    .map(extractUser)
    .filter((u): u is AppUser => u !== null && u.id !== columnUserId)

  return (
    <article
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(project)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect(project)
        }
      }}
      className={`rounded-lg border border-border bg-surface p-3 transition-colors ${
        onSelect
          ? 'cursor-pointer hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
          : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{project.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${grupoBadgeClass(project.grupo)}`}
        >
          Grupo {project.grupo}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${estadoProyectoClass(project.estadoProyecto)}`}
        >
          {getEstadoProyectoLabel(project.estadoProyecto)}
        </span>
        {project.tipoProyecto && (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-200">
            <TipoProyectoIcon tipoProyecto={project.tipoProyecto} />
            {getTipoProyectoLabel(project.tipoProyecto)}
          </span>
        )}
        {project.tecnologia && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
            <TecnologiaIcon tecnologia={project.tecnologia} />
            {project.tecnologia}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
          <IoCashOutline size={12} />
          {project.estadoPago || '—'}
        </span>
      </div>

      {otrosUsuarios.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <IoPeopleOutline size={12} className="text-slate-500" />
          <span>Con: {otrosUsuarios.map((u) => u.name).join(', ')}</span>
        </div>
      )}
    </article>
  )
}
