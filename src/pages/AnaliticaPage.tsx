import { useEffect, useMemo, useState } from 'react'
import { IoAnalyticsOutline, IoRefreshOutline } from 'react-icons/io5'
import { useAnaliticaStore } from '../stores/analiticaStore'
import { MonthlyBarChart } from '../components/analitica/MonthlyBarChart'
import { Leaderboard } from '../components/analitica/Leaderboard'
import { Button } from '../components/ui/Button'
import { LoaderBlock } from '../components/ui/Loader'
import { Select } from '../components/ui/Select'

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  })
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}

export function AnaliticaPage() {
  const data = useAnaliticaStore((s) => s.data)
  const loading = useAnaliticaStore((s) => s.loading)
  const error = useAnaliticaStore((s) => s.error)
  const fetchAnalitica = useAnaliticaStore((s) => s.fetchAnalitica)

  const [mesFiltro, setMesFiltro] = useState('todos')

  useEffect(() => {
    fetchAnalitica()
  }, [fetchAnalitica])

  const meses = useMemo(() => data?.porMes.map((m) => m.mes) ?? [], [data])
  const mesSeleccionado = mesFiltro !== 'todos' && meses.includes(mesFiltro) ? mesFiltro : 'todos'

  const disenadores = useMemo(() => {
    if (!data) return []
    const filas =
      mesSeleccionado === 'todos'
        ? data.disenadoresPorMes
        : data.disenadoresPorMes.filter((f) => f.mes === mesSeleccionado)

    const totales = new Map<number, { usuarioId: number; nombre: string; cantidad: number }>()
    for (const fila of filas) {
      const actual = totales.get(fila.usuarioId) ?? {
        usuarioId: fila.usuarioId,
        nombre: fila.nombre,
        cantidad: 0,
      }
      actual.cantidad += fila.cantidad
      totales.set(fila.usuarioId, actual)
    }
    return [...totales.values()]
  }, [data, mesSeleccionado])

  const desarrolladores = useMemo(() => {
    if (!data) return []
    const filas =
      mesSeleccionado === 'todos'
        ? data.desarrolladoresPorMes
        : data.desarrolladoresPorMes.filter((f) => f.mes === mesSeleccionado)

    const totales = new Map<number, { usuarioId: number; nombre: string; cantidad: number }>()
    for (const fila of filas) {
      const actual = totales.get(fila.usuarioId) ?? {
        usuarioId: fila.usuarioId,
        nombre: fila.nombre,
        cantidad: 0,
      }
      actual.cantidad += fila.cantidad
      totales.set(fila.usuarioId, actual)
    }
    return [...totales.values()]
  }, [data, mesSeleccionado])

  const duracionDiseno = data?.duracionPromedio.find((d) => d.etapa === 'Diseno')
  const duracionDesarrollo = data?.duracionPromedio.find((d) => d.etapa === 'Desarrollo')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Analítica</h1>
          <p className="text-sm text-slate-400">
            Diseños y desarrollos finalizados, quién los cerró, y cuánto tardan.
          </p>
        </div>
        <Button variant="secondary" className="w-full sm:w-auto" onClick={fetchAnalitica} loading={loading}>
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <LoaderBlock label="Cargando analítica..." />
      ) : !data ? null : (
        <div className="flex-1 space-y-6 overflow-y-auto pb-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <p className="text-xs text-slate-400">Duración promedio en Diseño</p>
              <p className="mt-1 text-3xl font-bold text-slate-100">
                {duracionDiseno && duracionDiseno.cantidadProyectos > 0
                  ? `${duracionDiseno.promedioDias} días`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {duracionDiseno && duracionDiseno.cantidadProyectos > 0
                  ? `Sobre ${duracionDiseno.cantidadProyectos} proyecto${duracionDiseno.cantidadProyectos !== 1 ? 's' : ''} medido${duracionDiseno.cantidadProyectos !== 1 ? 's' : ''}`
                  : 'Todavía no hay proyectos con ambas marcas de tiempo'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-raised p-4">
              <p className="text-xs text-slate-400">Duración promedio en Desarrollo</p>
              <p className="mt-1 text-3xl font-bold text-slate-100">
                {duracionDesarrollo && duracionDesarrollo.cantidadProyectos > 0
                  ? `${duracionDesarrollo.promedioDias} días`
                  : '—'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {duracionDesarrollo && duracionDesarrollo.cantidadProyectos > 0
                  ? `Sobre ${duracionDesarrollo.cantidadProyectos} proyecto${duracionDesarrollo.cantidadProyectos !== 1 ? 's' : ''} medido${duracionDesarrollo.cantidadProyectos !== 1 ? 's' : ''}`
                  : 'Todavía no hay proyectos con ambas marcas de tiempo'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">Proyectos finalizados por mes</h2>
            <MonthlyBarChart data={data.porMes} />
          </div>

          <div>
            <div className="mb-3 w-56">
              <Select
                label="Ranking del mes"
                value={mesSeleccionado}
                onChange={(e) => setMesFiltro(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos los meses' },
                  ...meses.map((mes) => ({ value: mes, label: formatMesLabel(mes) })),
                ]}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Leaderboard
                title="Diseñadores — diseños finalizados"
                items={disenadores}
                emptyMessage="Sin diseños finalizados en este período."
              />
              <Leaderboard
                title="Desarrolladores — desarrollos finalizados"
                items={desarrolladores}
                emptyMessage="Sin desarrollos finalizados en este período."
              />
            </div>
          </div>

          {data.porMes.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <IoAnalyticsOutline size={28} className="text-slate-600" />
              <p className="text-sm text-slate-500">
                Todavía no hay proyectos que hayan llegado a Diseño Finalizado o Desarrollo
                Finalizado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
