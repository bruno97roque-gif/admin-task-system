import type { Analitica } from '../../types'
import { BarrasVerticales } from './graficos/BarrasVerticales'
import { DuracionPorEtapa } from './graficos/DuracionPorEtapa'
import { META_DIAS, ORDEN_SERIES, SERIES, mesCorto, mesLargo, ultimosMeses } from './graficos/comun'
import { Leyenda, TarjetaGrafico } from './graficos/piezas'

const MESES_A_MOSTRAR = 6

/**
 * Los tres gráficos que se ven de entrada: el flujo mensual apilado, la
 * duración de cada etapa contra su meta y las entradas contra las entregas.
 * El resto vive en «Análisis avanzado».
 */
export function GraficosPrincipales({ data }: { data: Analitica }) {
  const meses = ultimosMeses(MESES_A_MOSTRAR)
  const etiquetas = meses.map(mesCorto)
  const titulos = meses.map(mesLargo)
  const delMes = (mes: string) => data.flujoMensual.find((f) => f.mes === mes)

  const valores = {
    nuevos: meses.map((m) => delMes(m)?.entraron ?? 0),
    diseno: meses.map((m) => delMes(m)?.disenosFinalizados ?? 0),
    desarrollo: meses.map((m) => delMes(m)?.desarrollosFinalizados ?? 0),
    entregados: meses.map((m) => delMes(m)?.finalizados ?? 0),
    archivados: meses.map((m) => delMes(m)?.archivados ?? 0),
  }

  const diseno = data.duracionPromedio.find((d) => d.etapa === 'Diseno')
  const desarrollo = data.duracionPromedio.find((d) => d.etapa === 'Desarrollo')

  const entraron = valores.nuevos.reduce((a, b) => a + b, 0)
  const desarrollados = valores.desarrollo.reduce((a, b) => a + b, 0)
  const entregados = valores.entregados.reduce((a, b) => a + b, 0)
  const saldo = entraron - entregados

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <TarjetaGrafico
        titulo="Flujo mensual"
        bajada={`Movimientos de los últimos ${MESES_A_MOSTRAR} meses, por tipo.`}
        className="lg:col-span-2 2xl:col-span-1"
      >
        <div className="mb-2">
          <Leyenda items={ORDEN_SERIES.map((c) => SERIES[c])} />
        </div>
        <BarrasVerticales
          etiquetas={etiquetas}
          titulosGlobo={titulos}
          modo="apilado"
          etiquetaEje="Movimientos por mes"
          series={ORDEN_SERIES.map((clave) => ({
            clave,
            nombre: SERIES[clave].nombre,
            color: SERIES[clave].color,
            valores: valores[clave],
          }))}
        />
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Duración por etapa" bajada="Días promedio de cada etapa frente a su meta.">
        <DuracionPorEtapa
          filas={[
            {
              clave: 'diseno',
              nombre: 'Diseño',
              color: SERIES.diseno.color,
              dias: diseno?.promedioDias ?? 0,
              medidos: diseno?.cantidadProyectos ?? 0,
              meta: META_DIAS.Diseno,
            },
            {
              clave: 'desarrollo',
              nombre: 'Desarrollo',
              color: SERIES.desarrollo.color,
              dias: desarrollo?.promedioDias ?? 0,
              medidos: desarrollo?.cantidadProyectos ?? 0,
              meta: META_DIAS.Desarrollo,
            },
          ]}
        />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Entradas vs. entregas"
        bajada="Si entran más de los que se entregan, el trabajo pendiente crece."
      >
        <div className="mb-2">
          <Leyenda
            items={[
              { nombre: 'Entraron', color: SERIES.nuevos.color },
              { nombre: 'Desarrollo finalizado', color: SERIES.desarrollo.color },
              { nombre: 'Entregados', color: SERIES.entregados.color },
            ]}
          />
        </div>
        <BarrasVerticales
          etiquetas={etiquetas}
          titulosGlobo={titulos}
          modo="agrupado"
          alto={190}
          etiquetaEje="Entradas, desarrollos finalizados y entregas por mes"
          series={[
            { clave: 'nuevos', nombre: 'Entraron', color: SERIES.nuevos.color, valores: valores.nuevos },
            {
              clave: 'desarrollo',
              nombre: 'Desarrollo finalizado',
              color: SERIES.desarrollo.color,
              valores: valores.desarrollo,
            },
            {
              clave: 'entregados',
              nombre: 'Entregados',
              color: SERIES.entregados.color,
              valores: valores.entregados,
            },
          ]}
          pieGlobo={(i) => {
            const diferencia = valores.nuevos[i] - valores.entregados[i]
            return (
              <p className="mt-1 border-t border-border pt-1 text-slate-400">
                Pendiente {diferencia > 0 ? `crece en ${diferencia}` : diferencia < 0 ? `baja en ${-diferencia}` : 'igual'}
              </p>
            )
          }}
        />
        <p className="mt-2 text-xs text-slate-400">
          En {MESES_A_MOSTRAR} meses entraron <span className="font-semibold text-slate-100">{entraron}</span>,
          terminaron el desarrollo <span className="font-semibold text-slate-100">{desarrollados}</span> y se
          entregaron <span className="font-semibold text-slate-100">{entregados}</span>:{' '}
          {saldo > 0
            ? `el trabajo pendiente creció en ${saldo}.`
            : saldo < 0
              ? `el trabajo pendiente bajó en ${-saldo}.`
              : 'el trabajo pendiente se mantuvo.'}
        </p>
      </TarjetaGrafico>
    </div>
  )
}
