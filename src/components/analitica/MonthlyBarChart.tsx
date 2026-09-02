import { useState } from 'react'
import type { AnaliticaMes } from '../../types'

const COLOR_DISENO = '#9085e9'
const COLOR_DESARROLLO = '#199e70'

const MARGIN = { top: 16, right: 12, bottom: 28, left: 28 }
const BAND_WIDTH = 64
const BAR_MAX_WIDTH = 22
const BAR_GAP = 2
const CHART_HEIGHT = 220

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  if (!year || !month) return mes
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-PE', {
    month: 'short',
  })
  return `${nombre.replace('.', '')} ${String(year).slice(2)}`
}

export function MonthlyBarChart({ data }: { data: AnaliticaMes[] }) {
  const [hover, setHover] = useState<{ mes: string; serie: string; valor: number; x: number; y: number } | null>(
    null,
  )

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
        Todavía no hay proyectos finalizados para graficar.
      </div>
    )
  }

  const maxValor = Math.max(1, ...data.map((d) => Math.max(d.disenosFinalizados, d.desarrollosFinalizados)))
  const tickMax = Math.ceil(maxValor / 2) * 2 || 2
  const ticks = [0, tickMax / 2, tickMax]

  const width = MARGIN.left + MARGIN.right + data.length * BAND_WIDTH
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom
  const yScale = (valor: number) => plotHeight - (valor / tickMax) * plotHeight

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_DISENO }} />
          Diseños finalizados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_DESARROLLO }} />
          Desarrollos finalizados
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
          width={width}
          height={CHART_HEIGHT}
          role="img"
          aria-label="Proyectos finalizados por mes"
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={0}
                  x2={width - MARGIN.left - MARGIN.right}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  stroke="#4a2a55"
                  strokeWidth={1}
                />
                <text x={-8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#94a3b8">
                  {tick}
                </text>
              </g>
            ))}

            {data.map((mes, i) => {
              const groupX = i * BAND_WIDTH
              const barWidth = Math.min(BAR_MAX_WIDTH, (BAND_WIDTH - 16) / 2)
              const xDiseno = groupX + BAND_WIDTH / 2 - barWidth - BAR_GAP / 2
              const xDesarrollo = groupX + BAND_WIDTH / 2 + BAR_GAP / 2

              return (
                <g key={mes.mes}>
                  <rect
                    x={xDiseno}
                    y={yScale(mes.disenosFinalizados)}
                    width={barWidth}
                    height={plotHeight - yScale(mes.disenosFinalizados)}
                    rx={4}
                    fill={COLOR_DISENO}
                    onMouseEnter={() =>
                      setHover({
                        mes: mes.mes,
                        serie: 'Diseños finalizados',
                        valor: mes.disenosFinalizados,
                        x: xDiseno + barWidth / 2,
                        y: yScale(mes.disenosFinalizados),
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                  <rect
                    x={xDesarrollo}
                    y={yScale(mes.desarrollosFinalizados)}
                    width={barWidth}
                    height={plotHeight - yScale(mes.desarrollosFinalizados)}
                    rx={4}
                    fill={COLOR_DESARROLLO}
                    onMouseEnter={() =>
                      setHover({
                        mes: mes.mes,
                        serie: 'Desarrollos finalizados',
                        valor: mes.desarrollosFinalizados,
                        x: xDesarrollo + barWidth / 2,
                        y: yScale(mes.desarrollosFinalizados),
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                  <text
                    x={groupX + BAND_WIDTH / 2}
                    y={plotHeight + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#94a3b8"
                  >
                    {formatMesLabel(mes.mes)}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute rounded-lg border border-border bg-surface-overlay px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            left: MARGIN.left + hover.x,
            top: MARGIN.top + hover.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-medium text-slate-100">{formatMesLabel(hover.mes)}</p>
          <p className="text-slate-300">
            {hover.serie}: <span className="font-semibold">{hover.valor}</span>
          </p>
        </div>
      )}
    </div>
  )
}
