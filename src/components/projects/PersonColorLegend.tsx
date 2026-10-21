import type { Project } from '../../types'
import { useColoresDeUsuarios } from '../../hooks/useColoresDeUsuarios'
import type { ColoresDelEquipo } from '../../utils/userColors'
import { TRAMOS_PAGO } from '../../utils/estadoPago'

/** Barra vertical que separa un bloque de la leyenda del siguiente. */
function Separador() {
  return <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
}

function PuntosDePersonas({
  ids,
  colorDe,
}: {
  ids: number[]
  colorDe: ColoresDelEquipo['colorDe']
}) {
  return (
    <>
      {ids.map((id) => {
        const color = colorDe(id)
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
    </>
  )
}

/** Leyenda de qué color le corresponde a cada diseñador/desarrollador, para
 * mapear los puntos de color que aparecen en las tarjetas de proyecto. Sale
 * del equipo de verdad: quien entra aparece solo y quien se va deja de salir.
 *
 * Con `mostrarPagos` suma los tramos de cobro, que en Vista Global son el
 * fondo de cada tarjeta. */
export function PersonColorLegend({
  mostrarPagos = false,
  projects,
}: {
  mostrarPagos?: boolean
  /** Lo que está a la vista, para no perder a quien ya no trabaja acá pero
   *  todavía tiene proyectos encima. */
  projects?: Project[]
}) {
  const { colorDe, disenadores, desarrolladores } = useColoresDeUsuarios(projects)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
      {disenadores.length > 0 && (
        <>
          <span className="font-medium text-slate-500">Diseñadores</span>
          <PuntosDePersonas ids={disenadores} colorDe={colorDe} />
        </>
      )}

      {desarrolladores.length > 0 && (
        <>
          {disenadores.length > 0 && <Separador />}
          <span className="font-medium text-slate-500">Desarrolladores</span>
          <PuntosDePersonas ids={desarrolladores} colorDe={colorDe} />
        </>
      )}

      {mostrarPagos && (
        <>
          <Separador />
          <span className="font-medium text-slate-300">Pagos</span>
          {TRAMOS_PAGO.map((pago) => (
            <span key={pago.tramo} className="flex items-center gap-1.5">
              <span
                className={`h-3 w-3 shrink-0 rounded-sm ${pago.swatch}`}
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
