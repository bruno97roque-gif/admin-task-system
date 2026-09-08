import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  IoAddOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoPeopleOutline,
  IoRefreshOutline,
  IoTrashOutline,
  IoVideocamOutline,
} from 'react-icons/io5'
import type { Reunion } from '../types'
import { useAuthStore } from '../stores/authStore'
import { useReunionesStore } from '../stores/reunionesStore'
import { useProjectsStore } from '../stores/projectsStore'
import { useUsersStore } from '../stores/usersStore'
import { useRolesStore } from '../stores/rolesStore'
import { isRestrictedRole } from '../utils/roleAccess'
import { getUsersByRoleName, toSelectOptions } from '../utils/assignableUsers'
import { formatDateTimeDisplay, toDateTimeInputValue } from '../utils/date'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { MultiSelect } from '../components/ui/MultiSelect'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'

interface ReunionForm {
  titulo: string
  descripcion: string
  fecha: string
  linkMeet: string
  proyectoId: string
  participantesIds: string[]
}

const emptyForm: ReunionForm = {
  titulo: '',
  descripcion: '',
  fecha: '',
  linkMeet: '',
  proyectoId: '',
  participantesIds: [],
}

const MEET_REGEX = /^https:\/\/meet\.google\.com\//

/** Una reunión sigue siendo «próxima» hasta una hora después de su inicio. */
const MARGEN_EN_CURSO_MS = 60 * 60 * 1000

function ReunionCard({
  reunion,
  pasada,
  esAdmin,
  onEdit,
  onDelete,
}: {
  reunion: Reunion
  pasada: boolean
  esAdmin: boolean
  onEdit: (r: Reunion) => void
  onDelete: (r: Reunion) => void
}) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
        pasada ? 'border-border/50 bg-surface-raised/50 opacity-70' : 'border-border bg-surface-raised'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-100">{reunion.titulo}</h3>
          {reunion.proyecto && (
            <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-slate-300">
              {reunion.proyecto.name}
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
          <IoCalendarOutline size={16} className="shrink-0 text-slate-500" />
          {formatDateTimeDisplay(reunion.fecha)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <IoPeopleOutline size={16} className="shrink-0 text-slate-500" />
          {reunion.participantes.length === 0 ? (
            <span>Sin convocados</span>
          ) : (
            reunion.participantes.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 rounded-full bg-surface-overlay/60 py-0.5 pl-0.5 pr-2 text-xs text-slate-200"
              >
                <Avatar userId={p.id} name={p.name} size={20} />
                {p.name}
              </span>
            ))
          )}
        </div>
        {reunion.descripcion && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-400">
            {reunion.descripcion}
          </p>
        )}
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <a
          href={reunion.linkMeet}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 sm:w-auto"
        >
          <IoVideocamOutline size={16} />
          Unirse a Meet
        </a>
        {esAdmin && (
          <>
            <Button variant="secondary" onClick={() => onEdit(reunion)} aria-label="Editar">
              <IoCreateOutline size={16} />
            </Button>
            <Button
              variant="ghost"
              className="hover:text-red-400"
              onClick={() => onDelete(reunion)}
              aria-label="Eliminar"
            >
              <IoTrashOutline size={16} />
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

export function ReunionesPage() {
  const user = useAuthStore((s) => s.user)
  const esAdmin = !isRestrictedRole(user?.roleName)

  const reuniones = useReunionesStore((s) => s.reuniones)
  // «Ahora» fijado en la última carga: separar próximas de pasadas sin Date.now() en el render.
  const ahora = useReunionesStore((s) => s.cargadoEn)
  const loading = useReunionesStore((s) => s.loading)
  const saving = useReunionesStore((s) => s.saving)
  const error = useReunionesStore((s) => s.error)
  const fetchReuniones = useReunionesStore((s) => s.fetchReuniones)
  const createReunion = useReunionesStore((s) => s.createReunion)
  const updateReunion = useReunionesStore((s) => s.updateReunion)
  const deleteReunion = useReunionesStore((s) => s.deleteReunion)

  const projects = useProjectsStore((s) => s.projects)
  const fetchProjects = useProjectsStore((s) => s.fetchProjects)
  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Reunion | null>(null)
  const [toDelete, setToDelete] = useState<Reunion | null>(null)
  const [showPasadas, setShowPasadas] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReunionForm>({ defaultValues: emptyForm })

  useEffect(() => {
    fetchReuniones(esAdmin)
  }, [fetchReuniones, esAdmin])

  useEffect(() => {
    if (!esAdmin) return
    fetchProjects()
    fetchUsers()
    fetchRoles()
  }, [esAdmin, fetchProjects, fetchUsers, fetchRoles])

  const { proximas, pasadas } = useMemo(() => {
    const limite = ahora - MARGEN_EN_CURSO_MS
    const proximas = reuniones
      .filter((r) => new Date(r.fecha).getTime() >= limite)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    const pasadas = reuniones
      .filter((r) => new Date(r.fecha).getTime() < limite)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    return { proximas, pasadas }
  }, [reuniones, ahora])

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users])
  const participantGroups = useMemo(() => {
    const disenadores = getUsersByRoleName(activeUsers, roles, 'Diseñador')
    const programadores = getUsersByRoleName(activeUsers, roles, 'Programador')
    const asignados = new Set([...disenadores, ...programadores].map((u) => u.id))
    const otros = activeUsers.filter((u) => !asignados.has(u.id))
    return [
      { label: 'Diseñadores', options: toSelectOptions(disenadores) },
      { label: 'Programadores', options: toSelectOptions(programadores) },
      { label: 'Otros', options: toSelectOptions(otros) },
    ]
  }, [activeUsers, roles])

  const projectOptions = useMemo(
    () =>
      projects
        .filter((p) => !p.deletedAt)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  )

  const openCreate = () => {
    setEditing(null)
    reset(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (reunion: Reunion) => {
    setEditing(reunion)
    reset({
      titulo: reunion.titulo,
      descripcion: reunion.descripcion ?? '',
      fecha: toDateTimeInputValue(reunion.fecha),
      linkMeet: reunion.linkMeet,
      proyectoId: reunion.proyectoId ? String(reunion.proyectoId) : '',
      participantesIds: reunion.participantes.map((p) => String(p.id)),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset(emptyForm)
  }

  const onSubmit = async (data: ReunionForm) => {
    const fecha = new Date(data.fecha)
    if (Number.isNaN(fecha.getTime())) {
      setError('fecha', { message: 'Fecha y hora inválidas' })
      return
    }

    const payload = {
      titulo: data.titulo.trim(),
      descripcion: data.descripcion.trim() || null,
      fecha: fecha.toISOString(),
      linkMeet: data.linkMeet.trim(),
      proyectoId: data.proyectoId ? Number(data.proyectoId) : null,
      participantesIds: data.participantesIds.map(Number),
    }

    const result = editing
      ? await updateReunion(editing.id, payload)
      : await createReunion(payload)

    if (result.success) {
      closeModal()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar la reunión' })
    }
  }

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
            {esAdmin ? 'Reuniones' : 'Mis reuniones'}
          </h1>
          <p className="text-sm text-slate-400">
            {esAdmin
              ? 'Agenda reuniones con el equipo; cada convocado recibe el link de Meet.'
              : 'Tus próximas reuniones con el link de Meet.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => fetchReuniones(esAdmin)}
            loading={loading}
          >
            <IoRefreshOutline size={18} />
            Actualizar
          </Button>
          {esAdmin && (
            <Button className="w-full sm:w-auto" onClick={openCreate}>
              <IoAddOutline size={18} />
              Nueva reunión
            </Button>
          )}
        </div>
      </header>

      {error && !modalOpen && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Próximas</h2>
        {loading && reuniones.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Cargando reuniones...</p>
        ) : proximas.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No hay reuniones próximas</p>
        ) : (
          proximas.map((r) => (
            <ReunionCard
              key={r.id}
              reunion={r}
              pasada={false}
              esAdmin={esAdmin}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))
        )}
      </section>

      {pasadas.length > 0 && (
        <section className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setShowPasadas((v) => !v)}
            className="text-sm font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
          >
            {showPasadas ? 'Ocultar pasadas' : `Ver pasadas (${pasadas.length})`}
          </button>
          {showPasadas &&
            pasadas.map((r) => (
              <ReunionCard
                key={r.id}
                reunion={r}
                pasada
                esAdmin={esAdmin}
                onEdit={openEdit}
                onDelete={setToDelete}
              />
            ))}
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar reunión' : 'Nueva reunión'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errors.root.message}
            </div>
          )}
          <Input
            label="Título"
            placeholder="Presentación de avance de diseño"
            error={errors.titulo?.message}
            {...register('titulo', { required: 'El título es obligatorio' })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fecha y hora"
              type="datetime-local"
              error={errors.fecha?.message}
              {...register('fecha', { required: 'La fecha es obligatoria' })}
            />
            <Select
              label="Proyecto (opcional)"
              placeholder="Sin proyecto"
              options={projectOptions}
              {...register('proyectoId')}
            />
          </div>
          <Input
            label="Link de Google Meet"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            error={errors.linkMeet?.message}
            {...register('linkMeet', {
              required: 'El link de Meet es obligatorio',
              validate: (value) =>
                MEET_REGEX.test(value.trim()) ||
                'Tiene que ser un enlace de Google Meet (https://meet.google.com/...)',
            })}
          />
          <Controller
            control={control}
            name="participantesIds"
            rules={{ validate: (value) => value.length > 0 || 'Elige al menos un participante' }}
            render={({ field }) => (
              <MultiSelect
                label="Participantes"
                groups={participantGroups}
                value={field.value}
                onChange={field.onChange}
                error={errors.participantesIds?.message}
                emptyMessage="No hay usuarios activos"
              />
            )}
          />
          <Textarea
            label="Descripción (opcional)"
            placeholder="Temario, qué hay que preparar..."
            rows={3}
            {...register('descripcion')}
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" loading={saving || isSubmitting}>
              {editing ? 'Guardar cambios' : 'Agendar reunión'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar reunión"
        message={toDelete ? `¿Eliminar "${toDelete.titulo}"?` : ''}
        onConfirm={async () => {
          if (toDelete) await deleteReunion(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
