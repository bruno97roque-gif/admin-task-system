import { useMemo } from 'react'
import { IoAlarmOutline, IoCheckmarkCircleOutline } from 'react-icons/io5'
import { useRecordatoriosStore } from '../../stores/recordatoriosStore'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface ReminderAlertProps {
  open: boolean
  onDismiss: () => void
  onGoToRecordatorios: () => void
}

export function ReminderAlert({ open, onDismiss, onGoToRecordatorios }: ReminderAlertProps) {
  const recordatorios = useRecordatoriosStore((s) => s.recordatorios)
  const finalizeRecordatorio = useRecordatoriosStore((s) => s.finalizeRecordatorio)

  const displayItems = useMemo(
    () => recordatorios.filter((r) => r.estado),
    [recordatorios],
  )

  const handleFinalize = async (id: number) => {
    const result = await finalizeRecordatorio(id)
    if (result.success) {
      const remaining = useRecordatoriosStore
        .getState()
        .recordatorios.filter((r) => r.estado)
      if (remaining.length === 0) {
        onDismiss()
      }
    }
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onDismiss} title="Recordatorios pendientes" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <IoAlarmOutline className="shrink-0 text-amber-400" size={24} />
          <p className="text-sm text-amber-200">
            Tienes {displayItems.length} recordatorio
            {displayItems.length > 1 ? 's' : ''} activo
            {displayItems.length > 1 ? 's' : ''}. Marca como finalizado para dejar de
            recibir alertas cada 5 minutos.
          </p>
        </div>

        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {displayItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <p className="min-w-0 whitespace-pre-wrap break-words text-sm text-slate-200">
                {item.descripcion}
              </p>
              <Button
                variant="success"
                className="w-full shrink-0 sm:w-auto"
                onClick={() => handleFinalize(item.id)}
              >
                <IoCheckmarkCircleOutline size={16} />
                Finalizado
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onGoToRecordatorios}>
            Ir a recordatorios
          </Button>
          <Button variant="ghost" className="w-full sm:w-auto" onClick={onDismiss}>
            Cerrar (volverá en 5 min)
          </Button>
        </div>
      </div>
    </Modal>
  )
}
