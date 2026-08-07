import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoAddOutline,
  IoAlarmOutline,
  IoCheckmarkCircleOutline,
  IoCreateOutline,
  IoRefreshOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import type { Recordatorio } from '../types'
import { useRecordatoriosStore } from '../stores/recordatoriosStore'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Textarea'

interface RecordatorioForm {
  descripcion: string
}

const emptyForm: RecordatorioForm = { descripcion: '' }

export function RecordatoriosPage() {
  const recordatorios = useRecordatoriosStore((s) => s.recordatorios)
  const loading = useRecordatoriosStore((s) => s.loading)
  const saving = useRecordatoriosStore((s) => s.saving)
  const error = useRecordatoriosStore((s) => s.error)
  const fetchRecordatorios = useRecordatoriosStore((s) => s.fetchRecordatorios)
  const createRecordatorio = useRecordatoriosStore((s) => s.createRecordatorio)
  const updateRecordatorio = useRecordatoriosStore((s) => s.updateRecordatorio)
  const finalizeRecordatorio = useRecordatoriosStore((s) => s.finalizeRecordatorio)
  const deleteRecordatorio = useRecordatoriosStore((s) => s.deleteRecordatorio)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showFinalizados, setShowFinalizados] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RecordatorioForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchRecordatorios()
  }, [fetchRecordatorios])

  const sorted = [...recordatorios].sort((a, b) => {
    if (a.estado !== b.estado) return a.estado ? -1 : 1
    return b.id - a.id
  })

  const displayed = showFinalizados
    ? sorted
    : sorted.filter((r) => r.estado)

  const itemToDelete = recordatorios.find((r) => r.id === deleteId)
  const pendingCount = recordatorios.filter((r) => r.estado).length
  const openCreate = () => {
    setEditingId(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: Recordatorio) => {
    setEditingId(item.id)
    reset({ descripcion: item.descripcion })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: RecordatorioForm) => {
    const descripcion = data.descripcion.trim()
    if (!descripcion) {
      setError('descripcion', { message: 'La descripción es obligatoria' })
      return
    }

    const result = editingId
      ? await updateRecordatorio(editingId, { descripcion })
      : await createRecordatorio({ descripcion })

    if (result.success) {
      closeModal()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar el recordatorio' })
    }
  }

  const handleFinalize = async (id: number) => {
    await finalizeRecordatorio(id)
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Recordatorios</h1>
          <p className="text-sm text-slate-400">
            Alertas cada 5 minutos hasta marcar como finalizado
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchRecordatorios()}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <IoAddOutline size={18} />
            Nuevo recordatorio
          </Button>
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <IoAlarmOutline className="shrink-0 text-amber-400" size={22} />
          <p className="text-sm text-amber-200">
            Tienes <strong>{pendingCount}</strong> recordatorio
            {pendingCount > 1 ? 's' : ''} activo{pendingCount > 1 ? 's' : ''}. Recibirás
            una alerta cada 5 minutos hasta presionar &quot;Finalizado&quot;.
          </p>
        </div>
      )}

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={showFinalizados}
            onChange={(e) => setShowFinalizados(e.target.checked)}
            className="rounded border-border bg-surface-raised accent-accent"
          />
          Mostrar finalizados
        </label>
      </div>

      <div className="space-y-3">
        {loading && recordatorios.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando recordatorios...</p>
        ) : displayed.length === 0 ? (
          <p className="py-12 text-center text-slate-500">No hay recordatorios</p>
        ) : (
          displayed.map((item) => (
            <article
              key={item.id}
              className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
                !item.estado
                  ? 'border-border/50 bg-surface-raised/50 opacity-60'
                  : 'border-border bg-surface-raised'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      item.estado
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.estado ? 'Activo' : 'Finalizado'}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">
                  {item.descripcion}
                </p>
              </div>

              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                {item.estado && (
                  <Button
                    variant="success"
                    className="w-full sm:w-auto"
                    onClick={() => handleFinalize(item.id)}
                  >
                    <IoCheckmarkCircleOutline size={16} />
                    Finalizado
                  </Button>
                )}
                <Button variant="secondary" onClick={() => openEdit(item)}>
                  <IoCreateOutline size={16} />
                </Button>
                <Button
                  variant="ghost"
                  className="hover:text-red-400"
                  onClick={() => setDeleteId(item.id)}
                >
                  <IoTrashOutline size={16} />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Editar recordatorio' : 'Nuevo recordatorio'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          <Textarea
            label="Descripción"
            placeholder="Escribe el recordatorio..."
            rows={6}
            error={errors.descripcion?.message}
            {...register('descripcion', { required: 'La descripción es obligatoria' })}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving || isSubmitting}>
              {editingId ? 'Guardar cambios' : 'Crear recordatorio'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar recordatorio"
        message={
          itemToDelete
            ? `¿Estás seguro de eliminar "${itemToDelete.descripcion.slice(0, 80)}${itemToDelete.descripcion.length > 80 ? '…' : ''}"?`
            : '¿Estás seguro de eliminar este recordatorio?'
        }
        onConfirm={async () => {
          if (deleteId) await deleteRecordatorio(deleteId)
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
