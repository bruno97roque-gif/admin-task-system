import { useState } from 'react'
import {
  IoArchiveOutline,
  IoArrowDownOutline,
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
 * Entradas y salidas de proyectos mes a mes. Entrar es darse de alta; salir es
 * cerrarse o archivarse. Cada mes se despliega para ver de qué proyectos se
 * trata, que es lo que hace útil el número.
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

              <span className="flex items-center gap-1 text-sm text-emerald-400" title="Entraron">
                <IoArrowUpOutline size={14} />
                {mes.entraron}
              </span>
              <span className="flex items-center gap-1 text-sm text-sky-400" title="Salieron">
                <IoArrowDownOutline size={14} />
                {mes.salieron}
              </span>
              <span
                title="Diferencia del mes"
                className={`w-12 text-right text-sm font-semibold ${
                  mes.neto > 0
                    ? 'text-emerald-400'
                    : mes.neto < 0
                      ? 'text-amber-400'
                      : 'text-slate-500'
                }`}
              >
                {mes.neto > 0 ? `+${mes.neto}` : mes.neto}
              </span>
            </button>

            {expandido && (
              <div className="grid gap-4 border-t border-border px-4 py-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                    <IoArrowUpOutline size={13} />
                    Entraron ({mes.entraron})
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
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sky-400 uppercase">
                    <IoArrowDownOutline size={13} />
                    Salieron ({mes.salieron})
                  </p>
                  {mes.salientes.length === 0 ? (
                    <p className="text-xs text-slate-600">Ninguno</p>
                  ) : (
                    <ul className="space-y-1">
                      {mes.salientes.map((p) => (
                        <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                          {p.motivo === 'Archivado' ? (
                            <IoArchiveOutline
                              size={13}
                              className="shrink-0 self-center text-amber-400"
                              title="Archivado"
                            />
                          ) : (
                            <IoCheckmarkCircleOutline
                              size={13}
                              className="shrink-0 self-center text-emerald-400"
                              title="Finalizado"
                            />
                          )}
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
