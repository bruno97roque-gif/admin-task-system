import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  IoCheckmarkCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoRefreshOutline,
  IoSendOutline,
  IoTrashOutline,
} from 'react-icons/io5'
import type { NotaAdmin } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useNotasStore } from '../stores/notasStore'
import { useProjectsStore } from '../stores/projectsStore'
import { isRestrictedRole } from '../utils/roleAccess'
import { isProjectAssignee } from '../utils/projectUsers'
import { formatRelativeTime } from '../utils/date'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface NotaForm {
  proyectoId: string
  contenido: string
}

const emptyForm: NotaForm = { proyectoId: '', contenido: '' }

function NotaCard({
  nota,
  esAdmin,
  onLeer,
  onDelete,
}: {
  nota: NotaAdmin
  esAdmin: boolean
  onLeer?: (nota: NotaAdmin) => void
  onDelete?: (nota: NotaAdmin) => void
}) {
  const pendiente = !nota.leidaAt

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
        pendiente && esAdmin ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface-raised'
      } ${!pendiente && esAdmin ? 'opacity-75' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-slate-200">
            {nota.proyecto.name}
          </span>
          {esAdmin && (
            <span className="flex items-center gap-1.5 text-sm text-slate-300">
              {nota.autor && <Avatar userId={nota.autor.id} name={nota.autor.name} size={22} />}
              {nota.autor?.name ?? 'Usuario eliminado'}
            </span>
          )}
          <span className="text-xs text-slate-500">{formatRelativeTime(nota.createdAt)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              pendiente ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {pendiente ? 'Sin leer' : 'Leída'}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-200">{nota.contenido}</p>
      </div>

      {esAdmin && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {pendiente && onLeer && (
            <Button variant="success" className="w-full sm:w-auto" onClick={() => onLeer(nota)}>
              <IoCheckmarkCircleOutline size={16} />
              Leída
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              className="hover:text-red-400"
              onClick={() => onDelete(nota)}
              aria-label="Eliminar"
            >
              <IoTrashOutline size={16} />
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

export function NotasPage() {
  const user = useAuthStore((s) => s.user)
  const esAdmin = !isRestrictedRole(user?.roleName)

  const notas = useNotasStore((s) => s.notas)
  const loading = useNotasStore((s) => s.loading)
  const saving = useNotasStore((s) => s.saving)
  const error = useNotasStore((s) => s.error)
  const fetchNotas = useNotasStore((s) => s.fetchNotas)
  const createNota = useNotasStore((s) => s.createNota)
  const marcarLeida = useNotasStore((s) => s.marcarLeida)
  const deleteNota = useNotasStore((s) => s.deleteNota)

  const projects = useProjectsStore((s) => s.projects)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)

  const [soloPendientes, setSoloPendientes] = useState(false)
  const [toDelete, setToDelete] = useState<NotaAdmin | null>(null)
  const [enviada, setEnviada] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NotaForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchNotas(esAdmin)
  }, [fetchNotas, esAdmin])

  useEffect(() => {
    if (!esAdmin) fetchProjects()
  }, [esAdmin, fetchProjects])

  const misProyectos = useMemo(() => {
    if (esAdmin || !user) return []
    return projects
      .filter((p) => !p.deletedAt && isProjectAssignee(p, user.roleName, user.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((p) => ({ value: String(p.id), label: p.name }))
  }, [projects, esAdmin, user])

  const visibles = esAdmin && soloPendientes ? notas.filter((n) => !n.leidaAt) : notas
  const pendientes = notas.filter((n) => !n.leidaAt).length

  const onSubmit = async (data: NotaForm) => {
    const contenido = data.contenido.trim()
    if (!contenido) {
      setError('contenido', { message: 'Escribe la nota' })
      return
    }

    const result = await createNota({ proyectoId: Number(data.proyectoId), contenido })

    if (result.success) {
      reset(emptyForm)
      setEnviada(true)
      setTimeout(() => setEnviada(false), 4000)
    } else {
      setError('root', { message: result.error ?? 'Error al enviar la nota' })
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {esAdmin ? 'Mensajes del equipo' : 'Dejar nota a administración'}
          </h1>
          <p className="text-sm text-slate-400">
            {esAdmin
              ? pendientes > 0
                ? `Tienes ${pendientes} nota${pendientes > 1 ? 's' : ''} sin leer`
                : 'Estás al día'
              : 'Elige el proyecto y cuenta qué pasa. Solo lo ve administración.'}
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => fetchNotas(esAdmin)}
          loading={loading}
        >
          <IoRefreshOutline size={18} />
          Actualizar
        </Button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!esAdmin && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 space-y-4 rounded-xl border border-border bg-surface-raised p-4 sm:p-5"
        >
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          {enviada && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <IoCheckmarkCircleOutline size={18} />
              Nota enviada. Administración ya fue notificada.
            </div>
          )}
          <Select
            label="Proyecto"
            placeholder="Elige un proyecto"
            options={misProyectos}
            error={errors.proyectoId?.message}
            {...register('proyectoId', { required: 'Elige el proyecto' })}
          />
          <Textarea
            label="Nota"
            placeholder="¿Qué quieres contarle a administración sobre este proyecto?"
            rows={5}
            maxLength={2000}
            error={errors.contenido?.message}
            {...register('contenido', { required: 'Escribe la nota' })}
          />
          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" loading={saving || isSubmitting}>
              <IoSendOutline size={16} />
              Enviar nota
            </Button>
          </div>
        </form>
      )}

      {esAdmin ? (
        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={soloPendientes}
              onChange={(e) => setSoloPendientes(e.target.checked)}
              className="rounded border-border bg-surface-raised accent-accent"
            />
            Solo sin leer
          </label>
        </div>
      ) : (
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <IoChatbubbleEllipsesOutline size={16} />
          Mis notas enviadas
        </h2>
      )}

      <div className="space-y-3">
        {loading && notas.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando notas...</p>
        ) : visibles.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            {esAdmin
              ? soloPendientes
                ? 'No hay notas sin leer'
                : 'Todavía no llegaron notas del equipo'
              : 'Todavía no enviaste ninguna nota'}
          </p>
        ) : (
          visibles.map((nota) => (
            <NotaCard
              key={nota.id}
              nota={nota}
              esAdmin={esAdmin}
              onLeer={(n) => marcarLeida(n.id)}
              onDelete={setToDelete}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar nota"
        message={
          toDelete
            ? `¿Eliminar la nota de ${toDelete.autor?.name ?? 'usuario'} sobre "${toDelete.proyecto.name}"?`
            : ''
        }
        onConfirm={async () => {
          if (toDelete) await deleteNota(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
