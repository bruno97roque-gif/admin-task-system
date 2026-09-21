import { useEffect } from 'react'
import { IoRefreshOutline } from 'react-icons/io5'
import { useAnaliticaStore } from '../stores/analiticaStore'
import { AnalisisAvanzado } from '../components/analitica/AnalisisAvanzado'
import { FlujoMensual } from '../components/analitica/FlujoMensual'
import { GraficosPrincipales } from '../components/analitica/GraficosPrincipales'
import { ResumenSuperior } from '../components/analitica/ResumenSuperior'
import { Button } from '../components/ui/Button'
import { LoaderBlock } from '../components/ui/Loader'

export function AnaliticaPage() {
  const data = useAnaliticaStore((s) => s.data)
  const loading = useAnaliticaStore((s) => s.loading)
  const error = useAnaliticaStore((s) => s.error)
  const fetchAnalitica = useAnaliticaStore((s) => s.fetchAnalitica)

  useEffect(() => {
    fetchAnalitica()
  }, [fetchAnalitica])

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
          <ResumenSuperior data={data} />

          <GraficosPrincipales data={data} />

          <section className="rounded-xl border border-border bg-surface-raised p-4">
            <h2 className="text-base font-semibold text-slate-100">Movimiento de proyectos por mes</h2>
            <p className="mb-4 text-xs text-slate-400">
              Altas, cierres, entregas y archivos por mes. Entregar es un logro y no resta; lo único
              que cuenta como pérdida es archivar. Haz clic en un mes para ver cuáles fueron.
            </p>
            <FlujoMensual data={data.flujoMensual} />
          </section>

          <AnalisisAvanzado data={data} />
        </div>
      )}
    </div>
  )
}
