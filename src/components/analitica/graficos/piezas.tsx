import type { ReactNode } from 'react'

export function Leyenda({ items }: { items: { nombre: string; color: string; punteada?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
      {items.map((item) => (
        <span key={item.nombre} className="flex items-center gap-1.5">
          {item.punteada ? (
            <span
              className="w-4 border-t-2 border-dashed"
              style={{ borderColor: item.color }}
              aria-hidden
            />
          ) : (
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
          )}
          {item.nombre}
        </span>
      ))}
    </div>
  )
}

/** Globo de ayuda sobre un gráfico; `x`/`y` en píxeles del contenedor. */
export function Globo({
  x,
  y,
  ancho,
  children,
}: {
  x: number
  y: number
  ancho: number
  children: ReactNode
}) {
  // Del lado donde entra: a la derecha del punto, o a la izquierda si no cabe.
  const aLaIzquierda = x > ancho - 190
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-40 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-xl"
      style={{
        left: aLaIzquierda ? undefined : x + 12,
        right: aLaIzquierda ? ancho - x + 12 : undefined,
        top: Math.max(0, y - 12),
      }}
    >
      {children}
    </div>
  )
}

export function FilaGlobo({
  color,
  nombre,
  valor,
}: {
  color?: string
  nombre: string
  valor: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && (
        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      )}
      <span className="flex-1 text-slate-400">{nombre}</span>
      <span className="font-semibold tabular-nums text-slate-100">{valor}</span>
    </div>
  )
}

/** Tarjeta de un gráfico: título, bajada y el contenido. */
export function TarjetaGrafico({
  titulo,
  bajada,
  children,
  className = '',
}: {
  titulo: string
  bajada?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-border bg-surface-raised p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-100">{titulo}</h3>
      {bajada && <p className="mt-0.5 text-xs text-slate-500">{bajada}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function SinDatos({ texto, alto = 180 }: { texto: string; alto?: number }) {
  return (
    <div
      className="flex items-center justify-center text-center text-xs text-slate-500"
      style={{ height: alto }}
    >
      {texto}
    </div>
  )
}
