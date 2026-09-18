import { useState } from 'react'
import type { IconType } from 'react-icons'
import {
  IoArchiveOutline,
  IoArrowUpOutline,
  IoCheckmarkCircleOutline,
  IoChevronDownOutline,
  IoCodeSlashOutline,
  IoColorPaletteOutline,
} from 'react-icons/io5'
import type { AnaliticaFlujoMes, AnaliticaProyectoMovimiento } from '../../types'
import { formatDateDisplay } from '../../utils/date'

function etiquetaMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-PE', {
    month: 'long',
  })
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${year}`
}

/** Las columnas del mes, en el orden del recorrido de un proyecto. */
interface Columna {
  clave: string
  titulo: string
  ayuda: string
  icono: IconType
  color: string
  cantidad: (mes: AnaliticaFlujoMes) => number
  proyectos: (mes: AnaliticaFlujoMes) => AnaliticaProyectoMovimiento[]
  /** Si en 0 se atenúa (solo archivados: que no haya es lo bueno). */
  apagadoEnCero?: boolean
}

const COLUMNAS: Columna[] = [
  {
    clave: 'nuevos',
    titulo: 'Nuevos',
    ayuda: 'Proyectos nuevos',
    icono: IoArrowUpOutline,
    color: 'text-sky-400',
    cantidad: (m) => m.entraron,
    proyectos: (m) => m.entrantes,
  },
  {
    clave: 'disenos',
    titulo: 'Diseño finalizado',
    ayuda: 'Llegaron a Diseño Finalizado',
    icono: IoColorPaletteOutline,
    color: 'text-violet-400',
    cantidad: (m) => m.disenosFinalizados ?? 0,
    proyectos: (m) => m.disenos ?? [],
  },
  {
    clave: 'desarrollos',
    titulo: 'Desarrollo finalizado',
    ayuda: 'Llegaron a Desarrollo Finalizado',
    icono: IoCodeSlashOutline,
    color: 'text-teal-400',
    cantidad: (m) => m.desarrollosFinalizados ?? 0,
    proyectos: (m) => m.desarrollos ?? [],
  },
  {
    clave: 'entregados',
    titulo: 'Entregados',
    ayuda: 'Finalizados: proyectos entregados',
    icono: IoCheckmarkCircleOutline,
    color: 'text-emerald-400',
    cantidad: (m) => m.finalizados,
    proyectos: (m) => m.salientes.filter((p) => p.motivo !== 'Archivado'),
  },
  {
    clave: 'archivados',
    titulo: 'Archivados',
    ayuda: 'Archivados: se perdió al cliente',
    icono: IoArchiveOutline,
    color: 'text-amber-400',
    cantidad: (m) => m.archivados,
    proyectos: (m) => m.salientes.filter((p) => p.motivo === 'Archivado'),
    apagadoEnCero: true,
  },
]

const porFecha = (a: AnaliticaProyectoMovimiento, b: AnaliticaProyectoMovimiento) =>
  new Date(a.fecha).getTime() - new Date(b.fecha).getTime()

function ListaDeProyectos({ proyectos }: { proyectos: AnaliticaProyectoMovimiento[] }) {
  if (proyectos.length === 0) {
    return <p className="text-xs text-slate-600">Ninguno</p>
  }
  return (
    <ul className="space-y-1">
      {[...proyectos].sort(porFecha).map((p) => (
        <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate text-slate-300" title={p.nombre}>
            {p.nombre}
          </span>
          <span className="shrink-0 text-xs text-slate-600">{formatDateDisplay(p.fecha)}</span>
        </li>
      ))}
    </ul>
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
    <div className="space-y-2">
      {meses.map((mes) => {
        const expandido = abierto === mes.mes

        return (
          <div key={mes.mes} className="rounded-lg border border-border bg-surface">
            <button
              type="button"
              onClick={() => setAbierto(expandido ? null : mes.mes)}
              aria-expanded={expandido}
              className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-surface-overlay/40"
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

              <span className="flex w-full justify-end gap-1 sm:w-auto">
                {COLUMNAS.map(({ clave, ayuda, icono: Icono, color, cantidad, apagadoEnCero }) => {
                  const n = cantidad(mes)
                  return (
                    <span
                      key={clave}
                      className={`flex w-14 items-center justify-end gap-1 text-sm ${
                        apagadoEnCero && n === 0 ? 'text-slate-600' : color
                      }`}
                      title={ayuda}
                    >
                      <Icono size={14} />
                      {n}
                    </span>
                  )
                })}
              </span>
            </button>

            {expandido && (
              <div className="grid gap-4 border-t border-border px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
                {COLUMNAS.map(({ clave, titulo, icono: Icono, color, cantidad, proyectos }) => (
                  <div key={clave} className="min-w-0">
                    <p
                      className={`mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${color}`}
                    >
                      <Icono size={13} />
                      {titulo} ({cantidad(mes)})
                    </p>
                    <ListaDeProyectos proyectos={proyectos(mes)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
