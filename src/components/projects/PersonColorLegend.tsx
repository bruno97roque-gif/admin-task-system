import { DESARROLLADOR_COLORS, DISENADOR_COLORS, getUserColor } from '../../utils/userColors'
import { TRAMOS_PAGO } from '../../utils/estadoPago'

/** Leyenda de qué color le corresponde a cada diseñador/desarrollador, para
 * mapear los puntos de color que aparecen en las tarjetas de proyecto.
 *
 * Con `mostrarPagos` suma los tramos de cobro, que en Vista Global son el
 * fondo de cada tarjeta. */
export function PersonColorLegend({ mostrarPagos = false }: { mostrarPagos?: boolean }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
      <span className="font-medium text-slate-500">Diseñadores</span>
      {DISENADOR_COLORS.map((id) => {
        const color = getUserColor(id)
        if (!color) return null
        return (
          <span key={id} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            {color.label}
          </span>
        )
      })}
      <span className="ml-2 font-medium text-slate-500">Desarrolladores</span>
      {DESARROLLADOR_COLORS.map((id) => {
        const color = getUserColor(id)
        if (!color) return null
        return (
          <span key={id} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            {color.label}
          </span>
        )
      })}
      {mostrarPagos && (
        <>
          <span className="ml-2 font-medium text-slate-500">Pagos</span>
          {TRAMOS_PAGO.map((pago) => (
            <span key={pago.tramo} className="flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-sm ${pago.swatch}`}
                aria-hidden="true"
              />
              {pago.label}
            </span>
          ))}
        </>
      )}
    </div>
  )
}
