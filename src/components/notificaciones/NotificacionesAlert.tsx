import { useNavigate } from 'react-router'
import { IoNotificationsOutline } from 'react-icons/io5'
import type { Notificacion } from '../../types'
import { useNotificacionesStore } from '../../stores/notificacionesStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { NotificacionItem } from './NotificacionItem'

interface NotificacionesAlertProps {
  nuevas: Notificacion[]
  onDismiss: () => void
}

export function NotificacionesAlert({ nuevas, onDismiss }: NotificacionesAlertProps) {
  const marcarLeida = useNotificacionesStore((s) => s.marcarLeida)
  const navigate = useNavigate()

  if (nuevas.length === 0) return null

  const marcarTodas = async () => {
    await Promise.all(nuevas.map((n) => marcarLeida(n.id)))
    onDismiss()
  }

  const verTodas = () => {
    onDismiss()
    navigate('/notificaciones')
  }

  return (
    <Modal open onClose={onDismiss} title="Tienes novedades" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3">
          <IoNotificationsOutline className="shrink-0 text-accent-hover" size={24} />
          <p className="text-sm text-slate-200">
            {nuevas.length === 1
              ? 'Llegó una notificación nueva.'
              : `Llegaron ${nuevas.length} notificaciones nuevas.`}
          </p>
        </div>

        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {nuevas.map((n) => (
            <li key={n.id}>
              <NotificacionItem notificacion={n} />
            </li>
          ))}
        </ul>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={onDismiss}>
            Cerrar
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={verTodas}>
            Ver todas
          </Button>
          <Button className="w-full sm:w-auto" onClick={marcarTodas}>
            Marcar como leídas
          </Button>
        </div>
      </div>
    </Modal>
  )
}
