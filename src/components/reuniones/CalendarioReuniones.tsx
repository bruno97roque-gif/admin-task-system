import { useMemo, useState } from 'react'
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'
import type { Reunion } from '../../types'
import {
  DIAS_SEMANA,
  agruparPorDia,
  claveDia,
  diasDeMes,
  diasDeSemana,
  esDelMes,
  esMismoDia,
  etiquetaMes,
  etiquetaSemana,
  horaCorta,
  rangoDeHoras,
  sumarDias,
  sumarMeses,
} from '../../utils/calendario'
import { Button } from '../ui/Button'

export type VistaCalendario = 'mes' | 'semana'

/** Cuántas reuniones entran en un día del mes antes de resumir con «+N más». */
const MAXIMO_POR_DIA = 3
const ALTO_HORA = 44

/** El color dice en qué estado está, igual que las etiquetas de la lista. */
function estiloDe(reunion: Reunion, ahora: number) {
  if (new Date(reunion.fecha).getTime() < ahora) {
    return { punto: 'bg-slate-500', bloque: 'border-slate-600/60 bg-surface-overlay text-slate-400' }
  }
  if (!reunion.linkMeet && !reunion.googleEventId) {
    return { punto: 'bg-amber-400', bloque: 'border-amber-500/40 bg-amber-500/10 text-amber-100' }
  }
  return { punto: 'bg-emerald-400', bloque: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50' }
}

const tituloDe = (r: Reunion) => `${horaCorta(new Date(r.fecha))} · ${r.titulo}`

/** Las reuniones duran una hora (es lo que crea el evento de Google). */
const DURACION_MIN = 60

/**
 * Reparte en columnas las reuniones que se pisan, para que una no tape a la
 * otra: cada una entra en la primera columna que ya esté libre a esa hora.
 */
function repartirEnColumnas(reuniones: Reunion[]): { reunion: Reunion; columna: number; columnas: number }[] {
  const enOrden = [...reuniones].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  )
  const finDeColumna: number[] = []
  const puestos = enOrden.map((reunion) => {
    const inicio = new Date(reunion.fecha).getTime()
    const fin = inicio + DURACION_MIN * 60 * 1000
    let columna = finDeColumna.findIndex((libreDesde) => libreDesde <= inicio)
    if (columna === -1) columna = finDeColumna.length
    finDeColumna[columna] = fin
    return { reunion, columna }
  })
  // Todas las del día comparten el ancho: más simple de leer que calcular
  // grupos sueltos, y los días con pocas reuniones igual se ven bien.
  const columnas = Math.max(1, finDeColumna.length)
  return puestos.map((p) => ({ ...p, columnas }))
}

/**
 * La agenda en calendario, de solo consulta: al tocar una reunión se vuelve a
 * la lista, que es donde se crea, edita y entra al Meet.
 */
export function CalendarioReuniones({
  reuniones,
  vista,
  ahora,
  onSelect,
}: {
  reuniones: Reunion[]
  vista: VistaCalendario
  /** «Ahora» de la última carga: lo pasado se dibuja apagado. */
  ahora: number
  onSelect: (reunion: Reunion) => void
}) {
  const [referencia, setReferencia] = useState(() => new Date())
  const [expandido, setExpandido] = useState<string | null>(null)
  const [diaElegido, setDiaElegido] = useState(() => claveDia(new Date()))

  const dias = useMemo(
    () => (vista === 'mes' ? diasDeMes(referencia) : diasDeSemana(referencia)),
    [vista, referencia],
  )
  const porDia = useMemo(
    () => agruparPorDia(reuniones, (r) => new Date(r.fecha)),
    [reuniones],
  )
  const delDia = (dia: Date) => porDia.get(claveDia(dia)) ?? []

  const mover = (pasos: number) =>
    setReferencia((actual) =>
      vista === 'mes' ? sumarMeses(actual, pasos) : sumarDias(actual, pasos * 7),
    )

  const etiqueta = vista === 'mes' ? etiquetaMes(referencia) : etiquetaSemana(dias)
  const hoy = new Date()

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-100">{etiqueta}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => mover(-1)} aria-label="Anterior">
            <IoChevronBackOutline size={18} />
          </Button>
          <Button variant="secondary" onClick={() => setReferencia(new Date())}>
            Hoy
          </Button>
          <Button variant="ghost" onClick={() => mover(1)} aria-label="Siguiente">
            <IoChevronForwardOutline size={18} />
          </Button>
        </div>
      </header>

      {vista === 'mes' ? (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia) => {
              const delMes = esDelMes(dia, referencia)
              const items = delDia(dia)
              const clave = claveDia(dia)
              const visibles = expandido === clave ? items : items.slice(0, MAXIMO_POR_DIA)

              return (
                <div
                  key={clave}
                  className={`min-h-16 rounded-lg border p-1 sm:min-h-28 ${
                    esMismoDia(dia, hoy)
                      ? 'border-accent/60 bg-accent/5'
                      : 'border-border bg-surface'
                  } ${delMes ? '' : 'opacity-40'} ${
                    diaElegido === clave ? 'ring-1 ring-accent sm:ring-0' : ''
                  }`}
                >
                  {/* En celular la grilla no da para listar: solo puntos, y el
                      detalle del día elegido va debajo. */}
                  <button
                    type="button"
                    onClick={() => setDiaElegido(clave)}
                    className="flex w-full items-center justify-between px-0.5 text-[11px] text-slate-400 sm:cursor-default"
                  >
                    <span className={esMismoDia(dia, hoy) ? 'font-bold text-accent-hover' : ''}>
                      {dia.getDate()}
                    </span>
                    {items.length > 0 && (
                      <span className="flex gap-0.5 sm:hidden">
                        {items.slice(0, 3).map((r) => (
                          <span
                            key={r.id}
                            className={`h-1.5 w-1.5 rounded-full ${estiloDe(r, ahora).punto}`}
                            aria-hidden
                          />
                        ))}
                      </span>
                    )}
                  </button>

                  <ul className="hidden space-y-0.5 sm:block">
                    {visibles.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(r)}
                          title={tituloDe(r)}
                          className={`w-full truncate rounded border px-1 py-0.5 text-left text-[11px] ${estiloDe(r, ahora).bloque}`}
                        >
                          {tituloDe(r)}
                        </button>
                      </li>
                    ))}
                    {items.length > MAXIMO_POR_DIA && (
                      <li>
                        <button
                          type="button"
                          onClick={() => setExpandido(expandido === clave ? null : clave)}
                          className="w-full px-1 text-left text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          {expandido === clave
                            ? 'Ver menos'
                            : `+${items.length - MAXIMO_POR_DIA} más`}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="mt-3 sm:hidden">
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {new Date(`${diaElegido}T12:00:00`).toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            {(porDia.get(diaElegido) ?? []).length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">Sin reuniones este día</p>
            ) : (
              <ul className="space-y-1">
                {(porDia.get(diaElegido) ?? []).map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r)}
                      className={`w-full truncate rounded-lg border px-2 py-1.5 text-left text-sm ${estiloDe(r, ahora).bloque}`}
                    >
                      {tituloDe(r)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <SemanaConHoras dias={dias} delDia={delDia} ahora={ahora} onSelect={onSelect} hoy={hoy} />
      )}
    </section>
  )
}

/** La semana con las horas al costado: sirve para ver los choques de horario. */
function SemanaConHoras({
  dias,
  delDia,
  ahora,
  onSelect,
  hoy,
}: {
  dias: Date[]
  delDia: (dia: Date) => Reunion[]
  ahora: number
  onSelect: (reunion: Reunion) => void
  hoy: Date
}) {
  const fechas = dias.flatMap((d) => delDia(d)).map((r) => new Date(r.fecha))
  const { desde, hasta } = rangoDeHoras(fechas)
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i)

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[36rem]">
        <div className="w-12 shrink-0" />
        <div className="grid flex-1 grid-cols-7 gap-1 text-center text-xs text-slate-500">
          {dias.map((dia, i) => (
            <span key={claveDia(dia)} className="py-1">
              {DIAS_SEMANA[i]}{' '}
              <span className={esMismoDia(dia, hoy) ? 'font-bold text-accent-hover' : 'text-slate-300'}>
                {dia.getDate()}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-w-[36rem]">
        <div className="w-12 shrink-0 pt-1">
          {horas.map((h) => (
            <div key={h} className="text-right text-[11px] text-slate-500" style={{ height: ALTO_HORA }}>
              {h}:00
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 gap-1">
          {dias.map((dia) => (
            <div
              key={claveDia(dia)}
              className={`relative rounded-lg border ${
                esMismoDia(dia, hoy) ? 'border-accent/60 bg-accent/5' : 'border-border bg-surface'
              }`}
              style={{ height: horas.length * ALTO_HORA }}
            >
              {horas.map((h, i) => (
                <div
                  key={h}
                  className={i === 0 ? '' : 'border-t border-border/50'}
                  style={{ height: ALTO_HORA }}
                />
              ))}

              {repartirEnColumnas(delDia(dia)).map(({ reunion: r, columna, columnas }) => {
                const fecha = new Date(r.fecha)
                const minutos = (fecha.getHours() - desde) * 60 + fecha.getMinutes()
                const ancho = 100 / columnas
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelect(r)}
                    title={tituloDe(r)}
                    className={`absolute overflow-hidden rounded border px-1 py-0.5 text-left text-[11px] ${estiloDe(r, ahora).bloque}`}
                    style={{
                      top: (minutos / 60) * ALTO_HORA,
                      height: ALTO_HORA - 4,
                      left: `calc(${columna * ancho}% + 2px)`,
                      width: `calc(${ancho}% - 4px)`,
                    }}
                  >
                    <span className="block truncate font-semibold">{horaCorta(fecha)}</span>
                    <span className="block truncate">{r.titulo}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
