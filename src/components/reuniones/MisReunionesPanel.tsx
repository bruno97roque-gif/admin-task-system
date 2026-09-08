import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { IoCalendarOutline, IoVideocamOutline } from 'react-icons/io5'
import { useReunionesStore } from '../../stores/reunionesStore'
import { formatDateTimeDisplay } from '../../utils/date'

/** Una reunión sigue siendo «próxima» hasta una hora después de su inicio. */
const MARGEN_EN_CURSO_MS = 60 * 60 * 1000

const MAXIMO = 5

/**
 * Columna con las próximas reuniones del usuario, al lado de sus proyectos en
 * los tableros de Developers y Diseñadores. Muestra hasta cinco; el resto se
 * ve en /reuniones.
 */
export function MisReunionesPanel() {
  const reuniones = useReunionesStore((s) => s.reuniones)
  const cargadoEn = useReunionesStore((s) => s.cargadoEn)
  const loading = useReunionesStore((s) => s.loading)
  const fetchReuniones = useReunionesStore((s) => s.fetchReuniones)

  useEffect(() => {
    fetchReuniones(false)
  }, [fetchReuniones])

  const proximas = useMemo(() => {
    const limite = cargadoEn - MARGEN_EN_CURSO_MS
    return reuniones
      .filter((r) => new Date(r.fecha).getTime() >= limite)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [reuniones, cargadoEn])

  return (
    <section className="flex w-[min(100%,20rem)] shrink-0 flex-col rounded-xl border border-border bg-surface-raised sm:w-80">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
          <IoVideocamOutline className="text-emerald-400" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">Mis reuniones</p>
          <p className="truncate text-xs text-slate-500">Las próximas, con su link</p>
        </div>
        {proximas.length > 0 && (
          <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-slate-300">
            {proximas.length}
          </span>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading && reuniones.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">Cargando...</p>
        ) : proximas.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            No tienes reuniones agendadas
          </p>
        ) : (
          proximas.slice(0, MAXIMO).map((reunion) => (
            <article
              key={reunion.id}
              className="rounded-lg border border-border bg-surface p-3"
            >
              <p className="text-sm font-medium text-slate-200">{reunion.titulo}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <IoCalendarOutline size={13} className="shrink-0" />
                {formatDateTimeDisplay(reunion.fecha)}
              </p>
              {reunion.proyecto && (
                <span className="mt-2 inline-block rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
                  {reunion.proyecto.name}
                </span>
              )}
              <a
                href={reunion.linkMeet}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
              >
                <IoVideocamOutline size={14} />
                Unirse a Meet
              </a>
            </article>
          ))
        )}
      </div>

      {proximas.length > MAXIMO && (
        <Link
          to="/reuniones"
          className="border-t border-border p-3 text-center text-xs font-medium text-accent-hover hover:underline"
        >
          Ver las {proximas.length} reuniones
        </Link>
      )}
    </section>
  )
}
