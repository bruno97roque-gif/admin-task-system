/**
 * Cálculos de fechas para el calendario de reuniones. Todo en hora local
 * (el equipo trabaja en Lima) y con la semana empezando el lunes.
 */

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** `2026-09-23` de una fecha, en hora local: sirve de clave por día. */
export function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

export function sumarMeses(fecha: Date, meses: number): Date {
  // Día 1 primero: sumar un mes desde el 31 se pasaría al mes siguiente.
  const d = new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1)
  return d
}

/** El lunes de la semana de `fecha`. */
export function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const desdeLunes = (d.getDay() + 6) % 7
  return sumarDias(d, -desdeLunes)
}

/** Los 7 días de la semana de `fecha`, de lunes a domingo. */
export function diasDeSemana(fecha: Date): Date[] {
  const lunes = inicioDeSemana(fecha)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

/**
 * Las 6 semanas que dibuja la grilla del mes: arranca el lunes de la semana
 * del día 1 y siempre devuelve 42 días, para que la grilla no salte de alto.
 */
export function diasDeMes(fecha: Date): Date[] {
  const primero = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  const inicio = inicioDeSemana(primero)
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i))
}

export const esMismoDia = (a: Date, b: Date) => claveDia(a) === claveDia(b)

export const esDelMes = (fecha: Date, referencia: Date) =>
  fecha.getMonth() === referencia.getMonth() && fecha.getFullYear() === referencia.getFullYear()

/** `Setiembre 2026`. */
export function etiquetaMes(fecha: Date): string {
  const texto = fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** `22 – 28 set 2026`, sin repetir el mes si es el mismo. */
export function etiquetaSemana(dias: Date[]): string {
  const [ini] = dias
  const fin = dias[dias.length - 1]
  const mesDe = (d: Date) => d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')
  const mismoMes = ini.getMonth() === fin.getMonth() && ini.getFullYear() === fin.getFullYear()
  return mismoMes
    ? `${ini.getDate()} – ${fin.getDate()} ${mesDe(fin)} ${fin.getFullYear()}`
    : `${ini.getDate()} ${mesDe(ini)} – ${fin.getDate()} ${mesDe(fin)} ${fin.getFullYear()}`
}

/** `4:00 p. m.` */
export const horaCorta = (fecha: Date) =>
  fecha.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' })

/**
 * El rango de horas que dibuja la vista semana: de 8 a 20, estirado si hay
 * reuniones fuera de esa franja.
 */
export function rangoDeHoras(fechas: Date[]): { desde: number; hasta: number } {
  const horas = fechas.map((f) => f.getHours())
  return {
    desde: Math.min(8, ...horas),
    // La última hora se dibuja completa, por eso el +1.
    hasta: Math.max(20, ...horas.map((h) => h + 1)),
  }
}

/** Agrupa cualquier cosa con fecha por día, usando `claveDia`. */
export function agruparPorDia<T>(items: T[], fechaDe: (item: T) => Date): Map<string, T[]> {
  const mapa = new Map<string, T[]>()
  for (const item of items) {
    const clave = claveDia(fechaDe(item))
    mapa.set(clave, [...(mapa.get(clave) ?? []), item])
  }
  for (const [clave, lista] of mapa) {
    mapa.set(
      clave,
      [...lista].sort((a, b) => fechaDe(a).getTime() - fechaDe(b).getTime()),
    )
  }
  return mapa
}
