import { useState } from 'react'
import {
  IoArchiveOutline,
  IoArrowUpOutline,
  IoCheckmarkCircleOutline,
  IoChevronDownOutline,
} from 'react-icons/io5'
import type { AnaliticaFlujoMes } from '../../types'
import { formatDateDisplay } from '../../utils/date'

function etiquetaMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-PE', {
    month: 'long',
  })
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${year}`
}

/**
 * Movimiento de proyectos mes a mes. Terminar y archivar van por separado a
 * propósito: cerrar un proyecto es un logro y no una baja, así que no se
 * resta de las altas. Lo único que resta valor es archivar, que es haber
 * perdido al cliente con el trabajo a medias.
 */
export function FlujoMensual({ data }: { data: AnaliticaFlujoMes[] }) {
  const masReciente = data.at(-1)?.mes
  const [abierto, setAbierto] = useState<string | null>(masReciente ?? null)

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">Todavía no hay movimientos</p>
  }

  // Más recientes arriba: es lo que se mira primero.
  const meses = [...data].reverse()

  return (
    <div className="space-y-2">
      {meses.map((mes) => {
        const expandido = abierto === mes.mes
        const finalizados = mes.salientes.filter((p) => p.motivo !== 'Archivado')
        const archivados = mes.salientes.filter((p) => p.motivo === 'Archivado')

        return (
          <div key={mes.mes} className="rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => setAbierto(expandido ? null : mes.mes)}
              aria-expanded={expandido}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-overlay/40"
            >
              <IoChevronDownOutline
                size={16}
                className={`shrink-0 text-slate-500 transition-transform ${
                  expandido ? '' : '-rotate-90'
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                {etiquetaMes(mes.mes)}
              </span>

              <span
                className="flex w-16 items-center justify-end gap-1 text-sm text-sky-400"
                title="Proyectos nuevos"
              >
                <IoArrowUpOutline size={14} />
                {mes.entraron}
              </span>
              <span
                className="flex w-16 items-center justify-end gap-1 text-sm text-emerald-400"
                title="Finalizados: proyectos entregados"
              >
                <IoCheckmarkCircleOutline size={14} />
                {mes.finalizados}
              </span>
              <span
                className={`flex w-16 items-center justify-end gap-1 text-sm ${
                  mes.archivados > 0 ? 'text-amber-400' : 'text-slate-600'
                }`}
                title="Archivados: se perdió al cliente"
              >
                <IoArchiveOutline size={14} />
                {mes.archivados}
              </span>
            </button>

            {expandido && (
              <div className="grid gap-4 border-t border-border px-4 py-3 sm:grid-cols-3">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sky-400 uppercase">
                    <IoArrowUpOutline size={13} />
                    Nuevos ({mes.entraron})
                  </p>
                  {mes.entrantes.length === 0 ? (
                    <p className="text-xs text-slate-600">Ninguno</p>
                  ) : (
                    <ul className="space-y-1">
                      {mes.entrantes.map((p) => (
                        <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate text-slate-300">{p.nombre}</span>
                          <span className="shrink-0 text-xs text-slate-600">
                            {formatDateDisplay(p.fecha)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                    <IoCheckmarkCircleOutline size={13} />
                    Entregados ({mes.finalizados})
                  </p>
                  {finalizados.length === 0 ? (
                    <p className="text-xs text-slate-600">Ninguno</p>
                  ) : (
                    <ul className="space-y-1">
                      {finalizados.map((p) => (
                        <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate text-slate-300">{p.nombre}</span>
                          <span className="shrink-0 text-xs text-slate-600">
                            {formatDateDisplay(p.fecha)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-400 uppercase">
                    <IoArchiveOutline size={13} />
                    Archivados ({mes.archivados})
                  </p>
                  {archivados.length === 0 ? (
                    <p className="text-xs text-slate-600">Ninguno</p>
                  ) : (
                    <ul className="space-y-1">
                      {archivados.map((p) => (
                        <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate text-slate-300">{p.nombre}</span>
                          <span className="shrink-0 text-xs text-slate-600">
                            {formatDateDisplay(p.fecha)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
