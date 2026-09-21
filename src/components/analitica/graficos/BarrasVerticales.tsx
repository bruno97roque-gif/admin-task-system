import { useState, type ReactNode } from 'react'
import { COLOR_EJE, COLOR_REJILLA, escala, useAncho } from './comun'
import { FilaGlobo, Globo } from './piezas'

export interface SerieBarras {
  clave: string
  nombre: string
  color: string
  valores: number[]
}

const MARGEN = { arriba: 10, derecha: 8, abajo: 26, izquierda: 30 }
const HUECO = 2
const RADIO = 4

/** Rectángulo con las esquinas de arriba redondeadas (el extremo del dato). */
function barra(x: number, y: number, w: number, h: number, redondear: boolean): string {
  if (h <= 0) return ''
  const r = redondear ? Math.min(RADIO, w / 2, h) : 0
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    r ? `Q${x},${y} ${x + r},${y}` : '',
    `H${x + w - r}`,
    r ? `Q${x + w},${y} ${x + w},${y + r}` : '',
    `V${y + h}`,
    'Z',
  ].join(' ')
}

/**
 * Barras verticales por categoría (meses o rangos), **apiladas** o
 * **agrupadas**. Un solo eje, rejilla tenue, 2 px de hueco entre piezas y
 * globo al pasar por cada columna.
 */
export function BarrasVerticales({
  etiquetas,
  titulosGlobo,
  series,
  modo = 'apilado',
  alto = 220,
  pieGlobo,
  etiquetaEje,
}: {
  etiquetas: string[]
  /** Títulos largos para el globo (si no, se usa la etiqueta). */
  titulosGlobo?: string[]
  series: SerieBarras[]
  modo?: 'apilado' | 'agrupado'
  alto?: number
  /** Una línea más al pie del globo de la columna `i`. */
  pieGlobo?: (i: number) => ReactNode
  etiquetaEje?: string
}) {
  const { ref, ancho } = useAncho<HTMLDivElement>()
  const [activo, setActivo] = useState<number | null>(null)

  const totales = etiquetas.map((_, i) => series.reduce((s, serie) => s + (serie.valores[i] ?? 0), 0))
  const maximo =
    modo === 'apilado'
      ? Math.max(0, ...totales)
      : Math.max(0, ...series.flatMap((s) => s.valores))
  const { tope, ticks } = escala(maximo)

  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha)
  const altoPlot = alto - MARGEN.arriba - MARGEN.abajo
  const banda = etiquetas.length > 0 ? anchoPlot / etiquetas.length : 0
  const y = (v: number) => MARGEN.arriba + altoPlot - (v / tope) * altoPlot

  const anchoGrupo = Math.min(banda * 0.62, modo === 'apilado' ? 40 : 56)
  const anchoBarra =
    modo === 'apilado'
      ? anchoGrupo
      : Math.max(4, (anchoGrupo - HUECO * (series.length - 1)) / series.length)

  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setActivo(null)}>
      {ancho > 0 && (
        <svg width={ancho} height={alto} role="img" aria-label={etiquetaEje}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha}
                y1={y(t)}
                y2={y(t)}
                stroke={COLOR_REJILLA}
              />
              <text
                x={MARGEN.izquierda - 6}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                fontSize={10}
                fill={COLOR_EJE}
              >
                {t}
              </text>
            </g>
          ))}

          {etiquetas.map((etiqueta, i) => {
            const centro = MARGEN.izquierda + banda * i + banda / 2
            const x0 = centro - anchoGrupo / 2
            let acumulado = 0
            const ultimaConValor = [...series].reverse().find((s) => (s.valores[i] ?? 0) > 0)

            return (
              <g key={etiqueta} opacity={activo === null || activo === i ? 1 : 0.45}>
                {series.map((serie, j) => {
                  const v = serie.valores[i] ?? 0
                  if (v <= 0) return null
                  if (modo === 'apilado') {
                    const base = acumulado
                    acumulado += v
                    const arriba = y(acumulado)
                    // El hueco de 2 px separa cada pieza de la de abajo.
                    const h = y(base) - arriba - (base > 0 ? HUECO : 0)
                    return (
                      <path
                        key={serie.clave}
                        d={barra(x0, arriba, anchoBarra, h, serie === ultimaConValor)}
                        fill={serie.color}
                      />
                    )
                  }
                  const x = x0 + j * (anchoBarra + HUECO)
                  return (
                    <path
                      key={serie.clave}
                      d={barra(x, y(v), anchoBarra, y(0) - y(v), true)}
                      fill={serie.color}
                    />
                  )
                })}
                <text
                  x={centro}
                  y={alto - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill={activo === i ? '#e7dcec' : COLOR_EJE}
                >
                  {etiqueta}
                </text>
                {/* Zona de pase del mouse: toda la columna, más grande que la barra. */}
                <rect
                  x={MARGEN.izquierda + banda * i}
                  y={MARGEN.arriba}
                  width={banda}
                  height={altoPlot + MARGEN.abajo}
                  fill="transparent"
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  tabIndex={0}
                  aria-label={`${titulosGlobo?.[i] ?? etiqueta}: ${series
                    .map((s) => `${s.nombre} ${s.valores[i] ?? 0}`)
                    .join(', ')}`}
                />
              </g>
            )
          })}
        </svg>
      )}

      {activo !== null && ancho > 0 && (
        <Globo
          x={MARGEN.izquierda + banda * activo + banda / 2 + anchoGrupo / 2}
          y={y(modo === 'apilado' ? totales[activo] : Math.max(...series.map((s) => s.valores[activo] ?? 0)))}
          ancho={ancho}
        >
          <p className="mb-1 font-semibold text-slate-100">{titulosGlobo?.[activo] ?? etiquetas[activo]}</p>
          {[...series].reverse().map((s) => (
            <FilaGlobo key={s.clave} color={s.color} nombre={s.nombre} valor={s.valores[activo] ?? 0} />
          ))}
          {modo === 'apilado' && series.length > 1 && (
            <div className="mt-1 border-t border-border pt-1">
              <FilaGlobo nombre="Total" valor={totales[activo]} />
            </div>
          )}
          {pieGlobo?.(activo)}
        </Globo>
      )}
    </div>
  )
}
