import { useState } from 'react'
import { IoChevronDownOutline } from 'react-icons/io5'
import type { AnaliticaFlujoMes, AnaliticaProyectoMovimiento } from '../../types'
import { SERIES, mesCorto, type ClaveSerie } from './graficos/comun'

/** Las columnas del mes, en el orden del recorrido de un proyecto. */
interface Columna {
  serie: ClaveSerie
  ayuda: string
  cantidad: (mes: AnaliticaFlujoMes) => number
  proyectos: (mes: AnaliticaFlujoMes) => AnaliticaProyectoMovimiento[]
}

const COLUMNAS: Columna[] = [
  {
    serie: 'nuevos',
    ayuda: 'Proyectos dados de alta en el mes',
    cantidad: (m) => m.entraron,
    proyectos: (m) => m.entrantes,
  },
  {
    serie: 'diseno',
    ayuda: 'Llegaron a Diseño Finalizado',
    cantidad: (m) => m.disenosFinalizados ?? 0,
    proyectos: (m) => m.disenos ?? [],
  },
  {
    serie: 'desarrollo',
    ayuda: 'Llegaron a Desarrollo Finalizado',
    cantidad: (m) => m.desarrollosFinalizados ?? 0,
    proyectos: (m) => m.desarrollos ?? [],
  },
  {
    serie: 'entregados',
    ayuda: 'Proyectos entregados (finalizados)',
    cantidad: (m) => m.finalizados,
    proyectos: (m) => m.salientes.filter((p) => p.motivo !== 'Archivado'),
  },
  {
    serie: 'archivados',
    ayuda: 'Archivados: se perdió al cliente',
    cantidad: (m) => m.archivados,
    proyectos: (m) => m.salientes.filter((p) => p.motivo === 'Archivado'),
  },
]

const totalDelMes = (m: AnaliticaFlujoMes) =>
  COLUMNAS.reduce((suma, c) => suma + c.cantidad(m), 0)

const porFecha = (a: AnaliticaProyectoMovimiento, b: AnaliticaProyectoMovimiento) =>
  new Date(a.fecha).getTime() - new Date(b.fecha).getTime()

/** `2026-09-03T…` → `03/09`. */
const diaMes = (fecha: string) => {
  const [, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}`
}

function ColumnaDelMes({ columna, mes }: { columna: Columna; mes: AnaliticaFlujoMes }) {
  const { nombre, color, icono: Icono } = SERIES[columna.serie]
  const proyectos = [...columna.proyectos(mes)].sort(porFecha)

  return (
    <div className="flex min-w-0 flex-col border-border px-4 py-4 sm:border-l sm:first:border-l-0">
      <p className="mb-3 flex items-center gap-2" title={columna.ayuda}>
        <Icono size={22} style={{ color }} aria-hidden />
        <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">{nombre}</span>
        <span className="rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-xs font-semibold tabular-nums text-slate-100">
          {columna.cantidad(mes)}
        </span>
      </p>

      {proyectos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-slate-500">
          <Icono size={26} aria-hidden />
          <span className="text-xs">Sin proyectos</span>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {proyectos.map((p) => (
            <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-200" title={p.nombre}>
                {p.nombre}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500">{diaMes(p.fecha)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Movimiento de proyectos mes a mes: los que entraron, los que llegaron a
 * Diseño Finalizado y a Desarrollo Finalizado, los entregados y los
 * archivados. Terminar y archivar van por separado a propósito: cerrar un
 * proyecto es un logro y no una baja, así que no se resta de las altas. Lo
 * único que resta valor es archivar, que es haber perdido al cliente con el
 * trabajo a medias.
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
    <div className="space-y-3">
      {meses.map((mes) => {
        const expandido = abierto === mes.mes
        const total = totalDelMes(mes)

        return (
          <div key={mes.mes} className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setAbierto(expandido ? null : mes.mes)}
              aria-expanded={expandido}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-surface-overlay/30"
            >
              <IoChevronDownOutline
                size={18}
                className={`shrink-0 text-slate-400 transition-transform ${expandido ? '' : '-rotate-90'}`}
              />
              <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-100">
                {mesCorto(mes.mes)}
              </span>

              {expandido ? (
                <span className="text-sm text-slate-400">
                  {total} movimiento{total !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="flex w-full flex-wrap justify-end gap-x-4 gap-y-1 sm:w-auto">
                  {COLUMNAS.map((c) => {
                    const { nombre, color, icono: Icono } = SERIES[c.serie]
                    return (
                      <span
                        key={c.serie}
                        className="flex items-center gap-1.5 text-sm tabular-nums text-slate-200"
                        title={`${nombre}: ${c.ayuda}`}
                      >
                        <Icono size={18} style={{ color }} aria-hidden />
                        {c.cantidad(mes)}
                      </span>
                    )
                  })}
                </span>
              )}
            </button>

            {expandido && (
              <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
                {COLUMNAS.map((c) => (
                  <ColumnaDelMes key={c.serie} columna={c} mes={mes} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
