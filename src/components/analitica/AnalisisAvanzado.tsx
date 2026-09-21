import { useMemo, useState } from 'react'
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoChevronDownOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import type { Analitica, AnaliticaResumenCumplimiento } from '../../types'
import { getEstadoProyectoLabel } from '../../utils/projectStatus'
import { formatDateDisplay } from '../../utils/date'
import { Select } from '../ui/Select'
import { Leaderboard } from './Leaderboard'
import { BarrasVerticales } from './graficos/BarrasVerticales'
import { LineasTendencia } from './graficos/LineasTendencia'
import { DIAS_ESTANCADO, SERIES, mesCorto, mesLargo, ultimosMeses } from './graficos/comun'
import { Leyenda, SinDatos, TarjetaGrafico } from './graficos/piezas'

const MESES = 6

/** Colores de estado: reservados para a tiempo / tarde / vencido, siempre con ícono y texto. */
const ESTADO = {
  bien: '#34b27b',
  alerta: '#e0a43a',
  critico: '#e5645e',
}
/** Tono neutro para las barras de una sola serie que no son una categoría. */
const NEUTRO = '#8a7596'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

function Cumplimiento({ titulo, r }: { titulo: string; r: AnaliticaResumenCumplimiento }) {
  const medidos = r.aTiempo + r.tarde
  const porcentaje = medidos > 0 ? Math.round((r.aTiempo / medidos) * 100) : null
  const total = r.aTiempo + r.tarde + r.vencidos
  const partes = [
    { clave: 'aTiempo', nombre: 'A tiempo', n: r.aTiempo, color: ESTADO.bien },
    { clave: 'tarde', nombre: 'Tarde', n: r.tarde, color: ESTADO.alerta },
    { clave: 'vencidos', nombre: 'Vencidos sin cerrar', n: r.vencidos, color: ESTADO.critico },
  ]

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-slate-300">{titulo}</p>
        <p className="text-2xl font-bold text-slate-100">{porcentaje === null ? '—' : `${porcentaje}%`}</p>
      </div>
      <p className="text-xs text-slate-500">a tiempo, sobre {plural(medidos, 'cierre con fecha', 'cierres con fecha')}</p>
      {total > 0 && (
        <div className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {partes
            .filter((p) => p.n > 0)
            .map((p) => (
              <span key={p.clave} style={{ flex: p.n, backgroundColor: p.color }} />
            ))}
        </div>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
        {partes.map((p) => (
          <li key={p.clave} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden />
            {p.nombre}: <span className="font-semibold text-slate-200">{p.n}</span>
          </li>
        ))}
        {r.sinFecha > 0 && <li>Sin fecha objetivo: {r.sinFecha}</li>}
      </ul>
    </div>
  )
}

/**
 * Lo que no hace falta ver siempre: tendencia de las duraciones, carga por
 * responsable, estancados, cumplimiento de fechas, retrocesos, tiempo total
 * y los rankings por mes. Se abre con un clic.
 */
export function AnalisisAvanzado({ data }: { data: Analitica }) {
  const [abierto, setAbierto] = useState(false)
  const [mesRanking, setMesRanking] = useState('todos')

  const meses = ultimosMeses(MESES)
  const etiquetas = meses.map(mesCorto)
  const titulos = meses.map(mesLargo)
  const tendencia = (m: string) => data.tendencia.find((t) => t.mes === m)

  const estancados = data.estancados.proyectos.filter((p) => p.dias >= DIAS_ESTANCADO)
  const conProblema = data.cumplimiento.proyectos.filter((p) => p.resultado !== 'aTiempo')
  const masLentos = [...data.tiempoTotal.proyectos].sort((a, b) => b.dias - a.dias).slice(0, 5)

  const mesesRanking = useMemo(() => data.porMes.map((m) => m.mes), [data])
  const mesElegido = mesRanking !== 'todos' && mesesRanking.includes(mesRanking) ? mesRanking : 'todos'
  const ranking = (filas: Analitica['disenadoresPorMes']) => {
    const totales = new Map<number, { usuarioId: number; nombre: string; cantidad: number }>()
    for (const f of filas) {
      if (mesElegido !== 'todos' && f.mes !== mesElegido) continue
      const actual = totales.get(f.usuarioId) ?? { usuarioId: f.usuarioId, nombre: f.nombre, cantidad: 0 }
      actual.cantidad += f.cantidad
      totales.set(f.usuarioId, actual)
    }
    return [...totales.values()]
  }

  return (
    <section className="rounded-xl border border-border bg-surface-raised">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <IoChevronDownOutline
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${abierto ? '' : '-rotate-90'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-slate-100">Análisis avanzado</span>
          <span className="block text-xs text-slate-400">
            Tendencia, carga por responsable, estancados, fechas objetivo, retrocesos y tiempo total.
          </span>
        </span>
      </button>

      {abierto && (
        <div className="grid grid-cols-1 gap-4 border-t border-border p-4 lg:grid-cols-2">
          <TarjetaGrafico
            titulo="Tendencia de la duración"
            bajada={`Días promedio de lo que cerró cada mes (últimos ${MESES}).`}
          >
            <div className="mb-2">
              <Leyenda items={[SERIES.diseno, SERIES.desarrollo]} />
            </div>
            <LineasTendencia
              etiquetas={etiquetas}
              titulosGlobo={titulos}
              series={[
                {
                  clave: 'diseno',
                  nombre: 'Diseño',
                  color: SERIES.diseno.color,
                  valores: meses.map((m) => tendencia(m)?.promedioDiseno ?? null),
                },
                {
                  clave: 'desarrollo',
                  nombre: 'Desarrollo',
                  color: SERIES.desarrollo.color,
                  valores: meses.map((m) => tendencia(m)?.promedioDesarrollo ?? null),
                },
              ]}
            />
          </TarjetaGrafico>

          <TarjetaGrafico titulo="Tiempo total hasta la entrega" bajada="Desde el alta del proyecto hasta Proyecto Finalizado.">
            <div className="flex items-center gap-4">
              <IoTimeOutline size={34} className="shrink-0 text-accent-hover" aria-hidden />
              <div>
                <p className="text-3xl font-bold text-slate-100">
                  {data.tiempoTotal.cantidadProyectos > 0 ? `${data.tiempoTotal.promedioDias} días` : '—'}
                </p>
                <p className="text-xs text-slate-400">
                  Promedio sobre {plural(data.tiempoTotal.cantidadProyectos, 'proyecto entregado', 'proyectos entregados')}
                </p>
              </div>
            </div>
            {masLentos.length > 0 && (
              <>
                <p className="mt-4 mb-1 text-xs font-semibold text-slate-400">Los que más tardaron</p>
                <ul className="space-y-1">
                  {masLentos.map((p) => (
                    <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-slate-200">{p.nombre}</span>
                      <span className="shrink-0 tabular-nums text-slate-400">{p.dias} días</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TarjetaGrafico>

          <TarjetaGrafico
            titulo="Carga por responsable"
            bajada="Etapas cerradas, cuánto tardan en promedio y qué tienen hoy. Los estancados marcan el cuello de botella."
            className="lg:col-span-2"
          >
            {data.porResponsable.length === 0 ? (
              <SinDatos texto="Todavía no hay datos por responsable." alto={80} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-slate-400">
                      <th className="py-2 pr-3 font-medium">Persona</th>
                      <th className="py-2 pr-3 font-medium">Cerrados</th>
                      <th className="py-2 pr-3 text-right font-medium">Promedio</th>
                      <th className="py-2 pr-3 text-right font-medium">Activos hoy</th>
                      <th className="py-2 text-right font-medium">Estancados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maxCerrados = Math.max(1, ...data.porResponsable.map((r) => r.cerrados))
                      return data.porResponsable.map((r) => {
                        const serie = r.rol === 'disenador' ? SERIES.diseno : SERIES.desarrollo
                        return (
                          <tr key={`${r.rol}-${r.usuarioId}`} className="border-b border-border/60 last:border-0">
                            <td className="py-2 pr-3">
                              <span className="block text-slate-100">{r.nombre}</span>
                              <span className="text-xs text-slate-500">
                                {r.rol === 'disenador' ? 'Diseño' : 'Desarrollo'}
                              </span>
                            </td>
                            <td className="w-[35%] py-2 pr-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 rounded-r"
                                  style={{
                                    width: `${(r.cerrados / maxCerrados) * 100}%`,
                                    minWidth: r.cerrados > 0 ? 4 : 0,
                                    backgroundColor: serie.color,
                                  }}
                                  aria-hidden
                                />
                                <span className="tabular-nums text-slate-200">{r.cerrados}</span>
                              </div>
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-200">
                              {r.promedioDias === null ? '—' : `${r.promedioDias} días`}
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-200">{r.activos}</td>
                            <td className="py-2 text-right">
                              {r.estancados > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-200">
                                  <IoAlertCircleOutline size={13} aria-hidden />
                                  {r.estancados}
                                </span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </TarjetaGrafico>

          <TarjetaGrafico
            titulo="Proyectos estancados"
            bajada="Proyectos activos según los días que llevan sin cambiar de etapa."
          >
            <BarrasVerticales
              etiquetas={data.estancados.rangos.map((r) => `${r.rango} días`)}
              modo="agrupado"
              alto={170}
              etiquetaEje="Proyectos activos por antigüedad en su etapa"
              series={[
                {
                  clave: 'proyectos',
                  nombre: 'Proyectos',
                  color: NEUTRO,
                  valores: data.estancados.rangos.map((r) => r.cantidad),
                },
              ]}
            />
            {estancados.length > 0 && (
              <>
                <p className="mt-3 mb-1 flex items-center gap-1 text-xs font-semibold text-amber-200">
                  <IoAlertCircleOutline size={14} aria-hidden />
                  {plural(estancados.length, `estancado (${DIAS_ESTANCADO}+ días)`, `estancados (${DIAS_ESTANCADO}+ días)`)}
                </p>
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {estancados.map((p) => (
                    <li key={p.proyectoId} className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-slate-200" title={p.nombre}>
                        {p.nombre}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {getEstadoProyectoLabel(p.etapa)} · {p.responsableNombre ?? 'Administración'}
                      </span>
                      <span className="w-14 shrink-0 text-right tabular-nums text-slate-300">{p.dias} d</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TarjetaGrafico>

          <TarjetaGrafico
            titulo="Cumplimiento de fechas objetivo"
            bajada="Cierre real frente a la fecha de entrega de diseño y a la de entrega."
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Cumplimiento titulo="Diseño" r={data.cumplimiento.diseno} />
              <Cumplimiento titulo="Entrega (desarrollo)" r={data.cumplimiento.entrega} />
            </div>
            {conProblema.length > 0 && (
              <>
                <p className="mt-4 mb-1 text-xs font-semibold text-slate-400">Atrasos</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {conProblema.map((p) => (
                    <li key={`${p.tipo}-${p.proyectoId}`} className="flex items-baseline gap-2 text-sm">
                      {p.resultado === 'vencido' ? (
                        <IoAlertCircleOutline size={14} className="shrink-0 self-center" style={{ color: ESTADO.critico }} aria-label="Vencido" />
                      ) : (
                        <IoTimeOutline size={14} className="shrink-0 self-center" style={{ color: ESTADO.alerta }} aria-label="Tarde" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-slate-200" title={p.nombre}>
                        {p.nombre}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {p.tipo === 'diseno' ? 'Diseño' : 'Entrega'} · meta {formatDateDisplay(p.fechaObjetivo)}
                      </span>
                      <span className="w-24 shrink-0 text-right text-xs text-slate-300">
                        {p.resultado === 'vencido' ? `vencido hace ${p.diasDiferencia} d` : `+${p.diasDiferencia} d tarde`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {conProblema.length === 0 && data.cumplimiento.proyectos.length > 0 && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <IoCheckmarkCircleOutline size={14} style={{ color: ESTADO.bien }} aria-hidden />
                Todo lo medido se cerró a tiempo.
              </p>
            )}
          </TarjetaGrafico>

          <TarjetaGrafico
            titulo="Retrocesos de etapa"
            bajada="Veces que un proyecto volvió a una etapa anterior (retrabajo)."
          >
            <BarrasVerticales
              etiquetas={etiquetas}
              titulosGlobo={titulos}
              modo="agrupado"
              alto={170}
              etiquetaEje="Retrocesos por mes"
              series={[
                {
                  clave: 'retrocesos',
                  nombre: 'Retrocesos',
                  color: NEUTRO,
                  valores: meses.map((m) => data.retrocesos.porMes.find((r) => r.mes === m)?.cantidad ?? 0),
                },
              ]}
            />
            {data.retrocesos.proyectos.length > 0 ? (
              <>
                <p className="mt-3 mb-1 text-xs font-semibold text-slate-400">Los más recientes</p>
                <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {data.retrocesos.proyectos.slice(0, 20).map((r, i) => (
                    <li key={`${r.proyectoId}-${i}`} className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-slate-200" title={r.nombre}>
                        {r.nombre}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {getEstadoProyectoLabel(r.desde)} → {getEstadoProyectoLabel(r.hacia)}
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-400">
                        {formatDateDisplay(r.fecha)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Ningún proyecto retrocedió de etapa.</p>
            )}
          </TarjetaGrafico>

          <div className="lg:col-span-2">
            <div className="mb-3 w-56">
              <Select
                label="Ranking del mes"
                value={mesElegido}
                onChange={(e) => setMesRanking(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos los meses' },
                  ...mesesRanking.map((m) => ({ value: m, label: mesLargo(m) })),
                ]}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Leaderboard
                title="Diseñadores — diseños finalizados"
                items={ranking(data.disenadoresPorMes)}
                emptyMessage="Sin diseños finalizados en este período."
              />
              <Leaderboard
                title="Desarrolladores — desarrollos finalizados"
                items={ranking(data.desarrolladoresPorMes)}
                emptyMessage="Sin desarrollos finalizados en este período."
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
