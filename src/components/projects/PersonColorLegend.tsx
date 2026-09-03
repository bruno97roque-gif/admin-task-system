import { DESARROLLADOR_COLORS, DISENADOR_COLORS, getUserColor } from '../../utils/userColors'

/** Leyenda de qué color le corresponde a cada diseñador/desarrollador, para
 * mapear los puntos de color que aparecen en las tarjetas de proyecto. */
export function PersonColorLegend() {
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
    </div>
  )
}
