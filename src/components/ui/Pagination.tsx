import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'
import { Select } from './Select'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  /** Singular y plural de lo que se lista, para el «Mostrando 1–10 de 41 proyectos». */
  itemLabel?: [string, string]
}

/** Qué números mostrar: primera, última, y una ventana alrededor de la actual. */
function paginasVisibles(actual: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const paginas = new Set<number>([1, total, actual - 1, actual, actual + 1])
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const salida: (number | 'gap')[] = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) salida.push('gap')
    salida.push(p)
  })
  return salida
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = ['elemento', 'elementos'],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)

  const botonBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>
          Mostrando {desde}–{hasta} de {total} {total === 1 ? itemLabel[0] : itemLabel[1]}
        </span>
        <div className="w-28">
          <Select
            label="Por página"
            aria-label="Proyectos por página"
            options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="py-1.5"
          />
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginación">
          <button
            type="button"
            className={`${botonBase} text-slate-300 hover:bg-surface-overlay`}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <IoChevronBackOutline size={16} />
          </button>
          {paginasVisibles(page, totalPages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-slate-500">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`${botonBase} ${
                  p === page
                    ? 'bg-accent text-white'
                    : 'text-slate-300 hover:bg-surface-overlay'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${botonBase} text-slate-300 hover:bg-surface-overlay`}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            <IoChevronForwardOutline size={16} />
          </button>
        </nav>
      )}
    </div>
  )
}
