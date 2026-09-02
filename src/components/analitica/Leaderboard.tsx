const BAR_COLOR = '#f18c1b'

export function Leaderboard({
  title,
  items,
  emptyMessage,
}: {
  title: string
  items: { usuarioId: number; nombre: string; cantidad: number }[]
  emptyMessage: string
}) {
  const ordenados = [...items].sort((a, b) => b.cantidad - a.cantidad)
  const max = Math.max(1, ...ordenados.map((i) => i.cantidad))

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      {ordenados.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2.5">
          {ordenados.map((item) => (
            <li key={item.usuarioId} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-slate-300">{item.nombre}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-overlay">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.cantidad / max) * 100}%`,
                    backgroundColor: BAR_COLOR,
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-100">
                {item.cantidad}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
