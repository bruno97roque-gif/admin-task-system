import { useState } from 'react'
import { COLOR_EJE, COLOR_META, COLOR_REJILLA, escala, useAncho } from './comun'
import { FilaGlobo, Globo, Leyenda } from './piezas'

export interface FilaDuracion {
  clave: string
  nombre: string
  color: string
  dias: number
  medidos: number
  meta: number
}

const MARGEN = { arriba: 6, derecha: 44, abajo: 24, izquierda: 84 }
const ALTO_FILA = 44
const GROSOR = 18

/**
 * Días promedio de cada etapa en barras horizontales, con la meta como una
 * marca punteada sobre cada fila. El valor va escrito al final de la barra.
 */
export function DuracionPorEtapa({ filas }: { filas: FilaDuracion[] }) {
  const { ref, ancho } = useAncho<HTMLDivElement>()
  const [activo, setActivo] = useState<number | null>(null)

  const maximo = Math.max(...filas.map((f) => Math.max(f.dias, f.meta)))
  const { tope, ticks } = escala(maximo, 4)
  const alto = MARGEN.arriba + filas.length * ALTO_FILA + MARGEN.abajo
  const anchoPlot = Math.max(0, ancho - MARGEN.izquierda - MARGEN.derecha)
  const x = (v: number) => MARGEN.izquierda + (v / tope) * anchoPlot

  return (
    <div>
      <div className="mb-2">
        <Leyenda items={[{ nombre: 'Meta', color: COLOR_META, punteada: true }]} />
      </div>
      <div ref={ref} className="relative w-full" onMouseLeave={() => setActivo(null)}>
        {ancho > 0 && (
          <svg width={ancho} height={alto} role="img" aria-label="Duración promedio por etapa">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={MARGEN.arriba}
                  y2={alto - MARGEN.abajo}
                  stroke={COLOR_REJILLA}
                />
                <text x={x(t)} y={alto - 8} textAnchor="middle" fontSize={10} fill={COLOR_EJE}>
                  {t}
                </text>
              </g>
            ))}

            {filas.map((f, i) => {
              const centro = MARGEN.arriba + i * ALTO_FILA + ALTO_FILA / 2
              const fin = x(f.dias)
              const w = Math.max(0, fin - MARGEN.izquierda)
              const r = Math.min(4, w / 2)
              return (
                <g key={f.clave} opacity={activo === null || activo === i ? 1 : 0.5}>
                  <text
                    x={MARGEN.izquierda - 10}
                    y={centro}
                    dy="0.32em"
                    textAnchor="end"
                    fontSize={12}
                    fill="#e7dcec"
                  >
                    {f.nombre}
                  </text>
                  {w > 0 && (
                    <path
                      d={`M${MARGEN.izquierda},${centro - GROSOR / 2} H${fin - r} Q${fin},${centro - GROSOR / 2} ${fin},${centro - GROSOR / 2 + r} V${centro + GROSOR / 2 - r} Q${fin},${centro + GROSOR / 2} ${fin - r},${centro + GROSOR / 2} H${MARGEN.izquierda} Z`}
                      fill={f.color}
                    />
                  )}
                  <text
                    // Después de la barra o de la meta, lo que quede más a la derecha,
                    // para que el número no quede tapado por la línea punteada.
                    x={Math.max(fin, x(f.meta)) + 8}
                    y={centro}
                    dy="0.32em"
                    fontSize={12}
                    fontWeight={600}
                    fill="#f4eef6"
                  >
                    {f.medidos > 0 ? f.dias : '—'}
                  </text>
                  <line
                    x1={x(f.meta)}
                    x2={x(f.meta)}
                    y1={centro - GROSOR / 2 - 6}
                    y2={centro + GROSOR / 2 + 6}
                    stroke={COLOR_META}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={0}
                    y={centro - ALTO_FILA / 2}
                    width={ancho}
                    height={ALTO_FILA}
                    fill="transparent"
                    tabIndex={0}
                    onMouseEnter={() => setActivo(i)}
                    onFocus={() => setActivo(i)}
                    aria-label={`${f.nombre}: ${f.dias} días en promedio, meta ${f.meta}`}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {activo !== null && ancho > 0 && (
          <Globo
            x={x(filas[activo].dias)}
            y={MARGEN.arriba + activo * ALTO_FILA}
            ancho={ancho}
          >
            <p className="mb-1 font-semibold text-slate-100">{filas[activo].nombre}</p>
            <FilaGlobo color={filas[activo].color} nombre="Promedio" valor={`${filas[activo].dias} días`} />
            <FilaGlobo nombre="Meta" valor={`${filas[activo].meta} días`} />
            <FilaGlobo
              nombre="Diferencia"
              valor={`${filas[activo].dias - filas[activo].meta > 0 ? '+' : ''}${
                Math.round((filas[activo].dias - filas[activo].meta) * 10) / 10
              } días`}
            />
            <FilaGlobo nombre="Proyectos medidos" valor={filas[activo].medidos} />
          </Globo>
        )}
      </div>
    </div>
  )
}
