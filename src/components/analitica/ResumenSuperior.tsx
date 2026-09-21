import type { IconType } from 'react-icons'
import {
  IoArchiveOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
  IoTimeOutline,
  IoTrendingDownOutline,
  IoTrendingUpOutline,
} from 'react-icons/io5'
import type { Analitica } from '../../types'
import {
  DIAS_ESTANCADO,
  ORDEN_SERIES,
  SERIES,
  mesActual,
  mesAnterior,
  mesCorto,
} from './graficos/comun'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Diferencia con signo y un decimal: `+2.3`, `−1`, `0`. */
const conSigno = (n: number) => {
  const r = Math.round(n * 10) / 10
  return r > 0 ? `+${r}` : r < 0 ? `−${Math.abs(r)}` : '0'
}

/** Cómo cambió la duración de una etapa frente al mes anterior. */
function Variacion({ actual, anterior, mes }: { actual: number | null; anterior: number | null; mes: string }) {
  if (actual === null || anterior === null) {
    return <p className="mt-2 text-xs text-slate-500">Sin cierres para comparar con {mesCorto(mesAnterior(mes))}</p>
  }
  const diferencia = actual - anterior
  const peor = diferencia > 0
  const Icono = peor ? IoTrendingUpOutline : IoTrendingDownOutline
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
      <Icono size={15} className={peor ? 'text-amber-300' : 'text-emerald-300'} aria-hidden />
      {diferencia === 0
        ? `Igual que en ${mesCorto(mesAnterior(mes))}`
        : `${conSigno(diferencia)} días frente a ${mesCorto(mesAnterior(mes))} (${actual} vs ${anterior})`}
    </p>
  )
}

function TarjetaDuracion({
  titulo,
  promedio,
  medidos,
  actual,
  anterior,
  mes,
}: {
  titulo: string
  promedio: number
  medidos: number
  actual: number | null
  anterior: number | null
  mes: string
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-surface-raised p-5">
      <IoTimeOutline size={34} className="mt-1 shrink-0 text-violet-300" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm text-slate-300">{titulo}</p>
        <p className="mt-1 text-3xl font-bold text-slate-100">{medidos > 0 ? `${promedio} días` : '—'}</p>
        <p className="mt-1 text-sm text-slate-400">
          {medidos > 0
            ? `Sobre ${plural(medidos, 'proyecto medido', 'proyectos medidos')}`
            : 'Todavía no hay proyectos con ambas marcas de tiempo'}
        </p>
        <Variacion actual={actual} anterior={anterior} mes={mes} />
      </div>
    </div>
  )
}

function Lectura({ icono: Icono, titulo, valor }: { icono: IconType; titulo: string; valor: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3">
      <Icono size={26} className="shrink-0 text-accent-hover" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{titulo}</p>
        <p className="truncate text-sm font-semibold text-slate-100" title={valor}>
          {valor}
        </p>
      </div>
    </div>
  )
}

/**
 * Lo primero que se ve: la duración promedio de cada etapa (con su cambio
 * frente al mes anterior) y una tira de lecturas rápidas del mes en curso.
 */
export function ResumenSuperior({ data }: { data: Analitica }) {
  const mes = mesActual()
  const anterior = mesAnterior(mes)

  const diseno = data.duracionPromedio.find((d) => d.etapa === 'Diseno')
  const desarrollo = data.duracionPromedio.find((d) => d.etapa === 'Desarrollo')
  const tendencia = (m: string) => data.tendencia.find((t) => t.mes === m)
  const flujo = (m: string) => data.flujoMensual.find((f) => f.mes === m)

  // --- Lecturas rápidas -------------------------------------------------
  const medidas = [
    { nombre: 'Diseño', dias: diseno?.promedioDias ?? 0, medidos: diseno?.cantidadProyectos ?? 0 },
    { nombre: 'Desarrollo', dias: desarrollo?.promedioDias ?? 0, medidos: desarrollo?.cantidadProyectos ?? 0 },
  ].filter((m) => m.medidos > 0)
  const lenta = [...medidas].sort((a, b) => b.dias - a.dias)[0]
  const rapida = [...medidas].sort((a, b) => a.dias - b.dias)[0]
  const brecha = lenta && rapida && lenta !== rapida ? lenta.dias - rapida.dias : null

  const esteMes = flujo(mes)
  const cantidades: Record<string, number> = {
    nuevos: esteMes?.entraron ?? 0,
    diseno: esteMes?.disenosFinalizados ?? 0,
    desarrollo: esteMes?.desarrollosFinalizados ?? 0,
    entregados: esteMes?.finalizados ?? 0,
    archivados: esteMes?.archivados ?? 0,
  }
  const masActiva = ORDEN_SERIES.reduce((a, b) => (cantidades[b] > cantidades[a] ? b : a))
  const entregasAntes = flujo(anterior)?.finalizados ?? 0
  const estancados = data.estancados.proyectos.filter((p) => p.dias >= DIAS_ESTANCADO).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TarjetaDuracion
          titulo="Duración promedio en Diseño"
          promedio={diseno?.promedioDias ?? 0}
          medidos={diseno?.cantidadProyectos ?? 0}
          actual={tendencia(mes)?.promedioDiseno ?? null}
          anterior={tendencia(anterior)?.promedioDiseno ?? null}
          mes={mes}
        />
        <TarjetaDuracion
          titulo="Duración promedio en Desarrollo"
          promedio={desarrollo?.promedioDias ?? 0}
          medidos={desarrollo?.cantidadProyectos ?? 0}
          actual={tendencia(mes)?.promedioDesarrollo ?? null}
          anterior={tendencia(anterior)?.promedioDesarrollo ?? null}
          mes={mes}
        />
      </div>

      <section className="grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-surface-raised sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-[minmax(0,0.9fr)_repeat(3,minmax(0,1fr))]">
        <div className="px-4 py-3 sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:self-center">
          <h2 className="text-base font-semibold text-slate-100">Lecturas rápidas</h2>
          <p className="text-xs text-slate-400">Hallazgos clave a partir de tus datos.</p>
        </div>
        <Lectura
          icono={IoTimeOutline}
          titulo="Etapa más lenta"
          valor={lenta ? `${lenta.nombre} · ${lenta.dias} días` : 'Sin datos'}
        />
        <Lectura
          icono={IoTrendingUpOutline}
          titulo="Brecha entre etapas"
          valor={brecha !== null && lenta ? `${conSigno(brecha)} días en ${lenta.nombre}` : 'Sin datos'}
        />
        <Lectura
          icono={SERIES[masActiva].icono}
          titulo={`Mayor actividad en ${mesCorto(mes)}`}
          valor={
            cantidades[masActiva] > 0
              ? `${SERIES[masActiva].nombre} · ${plural(cantidades[masActiva], 'movimiento', 'movimientos')}`
              : 'Sin movimientos aún'
          }
        />
        <Lectura
          icono={IoCheckmarkCircleOutline}
          titulo={`Entregas en ${mesCorto(mes)}`}
          valor={`${cantidades.entregados} (${conSigno(cantidades.entregados - entregasAntes)} vs ${mesCorto(anterior)})`}
        />
        <Lectura
          icono={IoHourglassOutline}
          titulo={`Estancados (${DIAS_ESTANCADO}+ días)`}
          valor={plural(estancados, 'proyecto', 'proyectos')}
        />
        <Lectura
          icono={IoArchiveOutline}
          titulo="Proyectos archivados"
          valor={`${cantidades.archivados} en ${mesCorto(mes)}`}
        />
      </section>
    </div>
  )
}
