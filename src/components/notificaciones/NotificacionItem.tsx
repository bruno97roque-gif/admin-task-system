import type { IconType } from 'react-icons'
import {
  IoBriefcaseOutline,
  IoCashOutline,
  IoChatbubbleEllipsesOutline,
  IoTimerOutline,
  IoVideocamOutline,
} from 'react-icons/io5'
import type { Notificacion, TipoNotificacion } from '../../types'
import { formatRelativeTime } from '../../utils/date'

const TIPO_META: Record<TipoNotificacion, { icon: IconType; className: string }> = {
  ProyectoAsignado: { icon: IoBriefcaseOutline, className: 'bg-indigo-500/20 text-indigo-300' },
  EtapaFinalizada: { icon: IoCashOutline, className: 'bg-amber-500/20 text-amber-300' },
  ReunionProgramada: { icon: IoVideocamOutline, className: 'bg-emerald-500/20 text-emerald-300' },
  // El recordatorio de «ya empieza» se distingue del aviso de agenda: uno
  // pide acción ahora, el otro solo informa.
  ReunionProxima: { icon: IoTimerOutline, className: 'bg-rose-500/20 text-rose-300' },
  NotaRecibida: { icon: IoChatbubbleEllipsesOutline, className: 'bg-sky-500/20 text-sky-300' },
  NotaRespondida: {
    icon: IoChatbubbleEllipsesOutline,
    className: 'bg-fuchsia-500/20 text-fuchsia-300',
  },
}

interface NotificacionItemProps {
  notificacion: Notificacion
  onClick?: (notificacion: Notificacion) => void
}

/** Renderiza links (el de Meet, por ejemplo) como enlaces clicables. */
function renderMensaje(mensaje: string) {
  const partes = mensaje.split(/(https?:\/\/\S+)/g)
  return partes.map((parte, index) =>
    /^https?:\/\//.test(parte) ? (
      <a
        key={index}
        href={parte}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="break-all text-accent-hover underline"
      >
        {parte}
      </a>
    ) : (
      <span key={index}>{parte}</span>
    ),
  )
}

export function NotificacionItem({ notificacion, onClick }: NotificacionItemProps) {
  const { icon: Icon, className } = TIPO_META[notificacion.tipo]
  const noLeida = !notificacion.leidaAt

  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick ? () => onClick(notificacion) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(notificacion)
              }
            }
          : undefined
      }
      className={`flex gap-3 rounded-xl border p-4 transition-colors ${
        noLeida
          ? 'border-accent/40 bg-accent/5'
          : 'border-border bg-surface-raised opacity-75'
      } ${onClick ? 'cursor-pointer hover:bg-surface-overlay/60' : ''}`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm ${noLeida ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
            {notificacion.titulo}
          </p>
          <span className="shrink-0 text-xs text-slate-500">
            {formatRelativeTime(notificacion.createdAt)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-400">
          {renderMensaje(notificacion.mensaje)}
        </p>
        {notificacion.proyecto && (
          <span className="mt-2 inline-block rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
            {notificacion.proyecto.name}
          </span>
        )}
      </div>
      {noLeida && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="No leída" />}
    </article>
  )
}
