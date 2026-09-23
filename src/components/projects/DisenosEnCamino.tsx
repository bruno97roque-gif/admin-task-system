import { useState } from 'react'
import { IoColorPaletteOutline } from 'react-icons/io5'
import type { Project } from '../../types'
import { estadoProyectoClass, getEstadoProyectoLabel } from '../../utils/projectStatus'
import { formatDateDisplay } from '../../utils/date'
import { proyectosEnDiseno } from '../../utils/proyectosEnDiseno'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/**
 * Lo que se le viene al desarrollador: los proyectos suyos que hoy están en
 * diseño, con la etapa en la que van, quién los diseña y para cuándo está
 * comprometida la entrega del diseño. Los de «Diseño Finalizado» son los que
 * ya pueden pasar a desarrollo.
 */
export function DisenosEnCamino({
  projects,
  /** En la vista de administración conviene decir de quién es cada uno. */
  mostrarDesarrollador = false,
}: {
  projects: Project[]
  mostrarDesarrollador?: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const enDiseno = proyectosEnDiseno(projects)

  return (
    <>
      <Button
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => setAbierto(true)}
        disabled={enDiseno.length === 0}
        title={
          enDiseno.length === 0
            ? 'No hay proyectos en diseño por ahora'
            : 'Proyectos en diseño que van a pasar a desarrollo'
        }
      >
        <IoColorPaletteOutline size={18} />
        Diseños en camino
        <span className="rounded-full bg-surface-overlay px-1.5 py-0.5 text-xs tabular-nums">
          {enDiseno.length}
        </span>
      </Button>

      <Modal
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Diseños en camino"
        size="lg"
      >
        <p className="mb-4 text-xs text-slate-500">
          Proyectos que hoy están en diseño. Cuando el diseño se cierre, pasan a tu tablero de
          desarrollo.
        </p>

        <ul className="space-y-2">
          {enDiseno.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{p.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {p.disenador ? `Diseña ${p.disenador.name}` : 'Sin diseñador asignado'}
                  {mostrarDesarrollador && p.desarrollador ? ` · Para ${p.desarrollador.name}` : ''}
                  {p.fechaEntregaDiseno
                    ? ` · Entrega de diseño ${formatDateDisplay(p.fechaEntregaDiseno)}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.estadoProyecto === 'DisenoFinalizado' && (
                  <span className="text-xs text-emerald-300">Listo para desarrollo</span>
                )}
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${estadoProyectoClass(p.estadoProyecto)}`}
                >
                  {getEstadoProyectoLabel(p.estadoProyecto)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  )
}
