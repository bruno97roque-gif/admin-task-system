/**
 * `estadoPago` se carga a mano y viene de todo: «50%», «50», «Pagado»,
 * «Pendiente», «Adelanto 30%». Acá se reduce a un porcentaje y a un tramo,
 * para poder pintar la tarjeta según cuánto se cobró y verlo de un vistazo.
 */

export type TramoPago = 'inicial' | 'parcial' | 'completo' | 'desconocido'

export interface TramoPagoInfo {
  tramo: TramoPago
  label: string
  /** Fondo de la tarjeta en el flujo activo (grupo A). */
  fondo: string
  /** Misma tinta, más apagada, para los congelados (grupos B y C). */
  fondoTenue: string
  /** Cuadrito de la leyenda: el mismo color, más sólido para que se vea. */
  swatch: string
}

const TRAMOS: Record<TramoPago, TramoPagoInfo> = {
  inicial: {
    tramo: 'inicial',
    label: 'Hasta 51%',
    fondo: 'bg-rose-500/25 text-slate-100 hover:bg-rose-500/35',
    fondoTenue: 'bg-rose-500/12 text-slate-400 hover:bg-rose-500/20',
    swatch: 'bg-rose-500',
  },
  parcial: {
    tramo: 'parcial',
    label: 'Del 52% al 99%',
    fondo: 'bg-amber-500/25 text-slate-100 hover:bg-amber-500/35',
    fondoTenue: 'bg-amber-500/12 text-slate-400 hover:bg-amber-500/20',
    swatch: 'bg-amber-500',
  },
  completo: {
    tramo: 'completo',
    label: 'Cobrado 100%',
    fondo: 'bg-emerald-500/25 text-slate-100 hover:bg-emerald-500/35',
    fondoTenue: 'bg-emerald-500/12 text-slate-400 hover:bg-emerald-500/20',
    swatch: 'bg-emerald-500',
  },
  desconocido: {
    tramo: 'desconocido',
    label: 'Sin dato',
    fondo: 'bg-surface text-slate-200 hover:bg-surface-overlay',
    fondoTenue: 'bg-surface/60 text-slate-400 hover:bg-surface/80',
    swatch: 'bg-slate-500',
  },
}

/** Orden en que se muestran en la leyenda: de lo que falta cobrar a lo cobrado. */
export const TRAMOS_PAGO: TramoPagoInfo[] = [
  TRAMOS.inicial,
  TRAMOS.parcial,
  TRAMOS.completo,
  TRAMOS.desconocido,
]

/**
 * Porcentaje cobrado, o `null` si el texto no dice nada aprovechable.
 * El número manda sobre las palabras: «50% pagado» son 50, no 100.
 */
export function porcentajePagado(estadoPago: string | null | undefined): number | null {
  const texto = estadoPago?.trim().toLowerCase()
  if (!texto) return null

  const numero = texto.match(/\d+(?:[.,]\d+)?/)
  if (numero) {
    const valor = Number(numero[0].replace(',', '.'))
    if (!Number.isFinite(valor)) return null
    return Math.min(100, Math.max(0, valor))
  }

  if (/pagad|cancelad|complet|saldad|total/.test(texto)) return 100
  if (/pendiente|sin pagar|no pag|debe|adeuda/.test(texto)) return 0

  return null
}

/** Tramo al que cae un `estadoPago`, con los colores que le tocan. */
export function tramoDePago(estadoPago: string | null | undefined): TramoPagoInfo {
  const porcentaje = porcentajePagado(estadoPago)
  if (porcentaje === null) return TRAMOS.desconocido
  if (porcentaje >= 100) return TRAMOS.completo
  // El corte va en 52: el 50 clavado del abono inicial es «recién arranca»,
  // y del 52 para arriba (el 80 del plan 50/30/20, por ejemplo) ya es
  // «falta el saldo».
  if (porcentaje >= 52) return TRAMOS.parcial
  return TRAMOS.inicial
}
