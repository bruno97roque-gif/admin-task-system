import { IoLayersOutline, IoPeopleOutline, IoTimeOutline } from 'react-icons/io5'
import type { Project } from '../../types'
import { getProjectUserNames } from '../../utils/projectUsers'

export function ProjectDetails({ project }: { project: Project }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
      {project.descripcion && <p className="text-sm text-slate-300">{project.descripcion}</p>}

      <dl className="space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <IoLayersOutline size={12} className="text-slate-500" />
          <span>Seguimiento: {project.seguimiento?.name ?? '—'}</span>
        </div>
        {project.diasSinResponder !== null && (
          <div className="flex items-center gap-1.5">
            <IoTimeOutline size={12} className="text-slate-500" />
            <span>{project.diasSinResponder} días sin responder</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <IoPeopleOutline size={12} className="text-slate-500" />
          <span>Equipo: {getProjectUserNames(project)}</span>
        </div>
      </dl>
    </div>
  )
}
