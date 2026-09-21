import { useState } from 'react'
import { COLOR_EJE, COLOR_REJILLA, escala, useAncho } from './comun'
import { FilaGlobo, Globo } from './piezas'

export interface SerieLinea {
  clave: string
  nombre: string
  color: string
  /** `null` = ese mes no hubo nada que medir: la línea se corta. */
  valores: (number | null)[]
}

const MARGEN = { arriba: 12, derecha: 12, abajo: 26, izquierda: 30 }

/**
 * Evolución mes a mes con líneas de 2 px y puntos de 8 px. Pasar el mouse
 * marca el mes con una guía vertical y muestra todos los valores.
 */
export function LineasTendencia({
  etiquetas,
  titulosGlobo,
  series,
  unidad = 'días',
  alto = 220,
}: {
  etiquetas: string[]
  titulosGlobo?: string[]
  series: SerieLinea[]
  unidad?: string
  alto?: number
}) {
  const { ref, ancho } = useAncho<HTMLDivElement>()
  const [activo, setActivo] = useState<number | null>(null)

  const maximo = Math.max(0, ...series.flatMap((s) => s.valores.filter((v): v is number => v !== null)))
  const { tope, ticks } = escala(maximo)
  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha)
  const altoPlot = alto - MARGEN.arriba - MARGEN.abajo
  const banda = etiquetas.length > 0 ? anchoPlot / etiquetas.length : 0
  const x = (i: number) => MARGEN.izquierda + banda * i + banda / 2
  const y = (v: number) => MARGEN.arriba + altoPlot - (v / tope) * altoPlot

  /** Tramos continuos: un mes sin dato corta la línea en vez de inventarlo. */
  const tramos = (valores: (number | null)[]) => {
    const resultado: string[] = []
    let actual = ''
    valores.forEach((v, i) => {
      if (v === null) {
        if (actual) resultado.push(actual)
        actual = ''
        return
      }
      actual += `${actual ? 'L' : 'M'}${x(i)},${y(v)} `
    })
    if (actual) resultado.push(actual)
    return resultado
  }

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setActivo(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label="Tendencia mensual">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha} y1={y(t)} y2={y(t)} stroke={COLOR_REJILLA} />
              <text x={MARGEN.izquierda - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={10} fill={COLOR_EJE}>
                {t}
              </text>
            </g>
          ))}
          {etiquetas.map((etiqueta, i) => (
            <text
              key={etiqueta}
              x={x(i)}
              y={alto - 8}
              textAnchor="middle"
              fontSize={10}
              fill={activo === i ? '#e7dcec' : COLOR_EJE}
            >
              {etiqueta}
            </text>
          ))}

          {activo !== null && (
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={MARGEN.arriba}
              y2={MARGEN.arriba + altoPlot}
              stroke={COLOR_EJE}
              strokeDasharray="2 3"
            />
          )}

          {series.map((s) => (
            <g key={s.clave}>
              {tramos(s.valores).map((d) => (
                <path key={d} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              ))}
              {s.valores.map((v, i) =>
                v === null ? null : (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={activo === i ? 5 : 4}
                    fill={s.color}
                    stroke="#2d1835"
                    strokeWidth={2}
                  />
                ),
              )}
            </g>
          ))}

          {etiquetas.map((etiqueta, i) => (
            <rect
              key={etiqueta}
              x={MARGEN.izquierda + banda * i}
              y={MARGEN.arriba}
              width={banda}
              height={altoPlot}
              fill="transparent"
              tabIndex={0}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              aria-label={`${titulosGlobo?.[i] ?? etiqueta}: ${series
                .map((s) => `${s.nombre} ${s.valores[i] ?? 'sin datos'}`)
                .join(', ')}`}
            />
          ))}
        </svg>
      )}

      {activo !== null && ancho > 0 && (
        <Globo x={x(activo)} y={MARGEN.arriba + 10} ancho={ancho}>
          <p className="mb-1 font-semibold text-slate-100">{titulosGlobo?.[activo] ?? etiquetas[activo]}</p>
          {series.map((s) => (
            <FilaGlobo
              key={s.clave}
              color={s.color}
              nombre={s.nombre}
              valor={s.valores[activo] === null ? 'sin datos' : `${s.valores[activo]} ${unidad}`}
            />
          ))}
        </Globo>
      )}
    </div>
  )
}
