import { useEffect } from 'react'
import { Link } from 'react-router'
import { IoCheckmarkDoneOutline, IoCloseOutline, IoNotificationsOutline } from 'react-icons/io5'
import type { Notificacion } from '../../types'
import { useNotificacionesStore } from '../../stores/notificacionesStore'
import { NotificacionItem } from './NotificacionItem'

interface NotificacionesPanelProps {
  open: boolean
  onClose: () => void
}

/**
 * Panel lateral con la bandeja del usuario. Lo abre la campanita, y también
 * se abre solo cuando llega algo nuevo. Marcar una como leída se hace con un
 * clic sobre ella; el listado completo vive en /notificaciones.
 */
export function NotificacionesPanel({ open, onClose }: NotificacionesPanelProps) {
  const notificaciones = useNotificacionesStore((s) => s.notificaciones)
  const noLeidas = useNotificacionesStore((s) => s.noLeidas)
  const loading = useNotificacionesStore((s) => s.loading)
  const marcarLeida = useNotificacionesStore((s) => s.marcarLeida)
  const marcarTodasLeidas = useNotificacionesStore((s) => s.marcarTodasLeidas)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const onClickItem = (n: Notificacion) => {
    if (!n.leidaAt) marcarLeida(n.id)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Cerrar notificaciones"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal
        aria-label="Notificaciones"
        className="absolute inset-y-0 right-0 flex w-[min(100%,24rem)] flex-col border-l border-border bg-surface-raised shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20">
            <IoNotificationsOutline className="text-accent-hover" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-100">Notificaciones</p>
            <p className="truncate text-xs text-slate-500">
              {noLeidas > 0 ? `${noLeidas} sin leer` : 'Estás al día'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-surface-overlay hover:text-slate-200"
          >
            <IoCloseOutline size={20} />
          </button>
        </header>

        {noLeidas > 0 && (
          <div className="shrink-0 border-b border-border px-4 py-2">
            <button
              type="button"
              onClick={() => marcarTodasLeidas()}
              className="flex items-center gap-1.5 text-xs font-medium text-accent-hover hover:underline"
            >
              <IoCheckmarkDoneOutline size={15} />
              Marcar todas como leídas
            </button>
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {loading && notificaciones.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Cargando...</p>
          ) : notificaciones.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Todavía no tienes notificaciones
            </p>
          ) : (
            notificaciones
              .slice(0, 15)
              .map((n) => (
                <NotificacionItem key={n.id} notificacion={n} onClick={onClickItem} />
              ))
          )}
        </div>

        <Link
          to="/notificaciones"
          onClick={onClose}
          className="shrink-0 border-t border-border p-3 text-center text-sm font-medium text-accent-hover hover:underline"
        >
          Ver todas
        </Link>
      </aside>
    </div>
  )
}
