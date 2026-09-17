import { IoCloseOutline } from 'react-icons/io5'
import type { Comunicado } from '../../types'
import { ESTILO_NIVEL, sePuedeCerrar } from '../../utils/comunicados'

/**
 * Un comunicado como aviso. Con `onCerrar` muestra la X; los urgentes nunca
 * la llevan, aunque se la pasen.
 */
export function ComunicadoAviso({
  comunicado,
  onCerrar,
  cerrando = false,
}: {
  comunicado: Comunicado
  onCerrar?: () => void
  cerrando?: boolean
}) {
  const { icon: Icon, className } = ESTILO_NIVEL[comunicado.nivel]
  const cerrable = onCerrar !== undefined && sePuedeCerrar(comunicado.nivel)

  return (
    <div
      role={comunicado.nivel === 'Urgente' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${className}`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{comunicado.titulo}</p>
        <p className="mt-0.5 whitespace-pre-wrap break-words opacity-90">{comunicado.mensaje}</p>
      </div>
      {cerrable && (
        <button
          type="button"
          onClick={onCerrar}
          disabled={cerrando}
          aria-label="Cerrar comunicado"
          title="No volver a mostrar"
          className="shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40"
        >
          <IoCloseOutline size={18} />
        </button>
      )}
    </div>
  )
}
