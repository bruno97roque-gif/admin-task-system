import { useEffect, useState } from 'react'
import { IoTimeOutline } from 'react-icons/io5'
import type { HistorialEtapa, Project } from '../../types'
import { getProjectHistorialRequest } from '../../services/api'
import { getEstadoProyectoLabel } from '../../utils/projectStatus'
import { formatDateTimeDisplay } from '../../utils/date'
import { Loader } from '../ui/Loader'
import { Modal } from '../ui/Modal'

export function ProjectHistorialModal({
  project,
  onClose,
}: {
  project: Project | null
  onClose: () => void
}) {
  const [historial, setHistorial] = useState<HistorialEtapa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return

    let cancelled = false

    getProjectHistorialRequest(project.id)
      .then((data) => {
        if (!cancelled) setHistorial(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el historial')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [project])

  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      title={project ? `Historial — ${project.name}` : 'Historial'}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader size={72} />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : historial.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <IoTimeOutline size={28} className="text-slate-600" />
          <p className="text-sm text-slate-500">Todavía no hay movimientos registrados.</p>
        </div>
      ) : (
        <ol className="space-y-3 border-l border-border pl-4">
          {[...historial].reverse().map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
              <p className="text-xs text-slate-500">{formatDateTimeDisplay(item.createdAt)}</p>
              <p className="text-sm text-slate-200">
                <span className="font-medium">{item.usuario?.name ?? 'Sistema'}</span>
                {item.motivo ? ` — ${item.motivo}` : ''}
              </p>
              {item.estadoAnterior && item.estadoAnterior !== item.estadoNuevo && (
                <p className="text-xs text-slate-500">
                  Estado: {getEstadoProyectoLabel(item.estadoAnterior)} →{' '}
                  {getEstadoProyectoLabel(item.estadoNuevo)}
                </p>
              )}
              {item.grupoAnterior && item.grupoAnterior !== item.grupoNuevo && (
                <p className="text-xs text-slate-500">
                  Grupo: {item.grupoAnterior} → {item.grupoNuevo}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
