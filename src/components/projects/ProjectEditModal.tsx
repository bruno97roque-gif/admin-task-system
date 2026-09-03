import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Project } from '../../types'
import type { UpdateProjectRequest } from '../../services/api'
import { useRolesStore } from '../../stores/rolesStore'
import { useSeguimientosStore } from '../../stores/seguimientosStore'
import { useUsersStore } from '../../stores/usersStore'
import { getUsersByRoleName, toSelectOptions } from '../../utils/assignableUsers'
import { TIPO_PROYECTO_OPTIONS } from '../../utils/projectType'
import { getEstadoProyectoOptions } from '../../utils/projectStatus'
import { toDateInputValue } from '../../utils/date'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DateInput } from '../ui/DateInput'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'

const DEFAULT_GRUPO_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

const TECNOLOGIA_OPTIONS = [
  { value: 'Shopify', label: 'Shopify' },
  { value: 'WordPress', label: 'WordPress' },
  { value: 'Personalizado', label: 'Personalizado' },
]

interface ProjectForm {
  name: string
  descripcion: string
  tipoProyecto: string
  grupo: string
  seguimientoId: string
  comentario: string
  tecnologia: string
  estadoPago: string
  estadoProyecto: string
  diasSinResponder: string
  fechaEntrega: string
  programadorId: string
  disenadorId: string
}

interface ProjectEditModalProps {
  project: Project | null
  onClose: () => void
  saving: boolean
  showTipoProyecto?: boolean
  grupoOptions?: { value: string; label: string }[]
  updateProject: (
    id: number,
    data: UpdateProjectRequest,
  ) => Promise<{ success: boolean; error?: string }>
  updateProjectResponsables: (
    id: number,
    data: { disenadorId: number; desarrolladorId: number },
  ) => Promise<{ success: boolean; error?: string }>
}

export function ProjectEditModal({
  project,
  onClose,
  saving,
  showTipoProyecto = true,
  grupoOptions = DEFAULT_GRUPO_OPTIONS,
  updateProject,
  updateProjectResponsables,
}: ProjectEditModalProps) {
  const seguimientos = useSeguimientosStore((s) => s.seguimientos)
  const fetchSeguimientos = useSeguimientosStore((s) => s.fetchSeguimientos)

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)

  const roles = useRolesStore((s) => s.roles)
  const fetchRoles = useRolesStore((s) => s.fetchRoles)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setError,
  } = useForm<ProjectForm>()

  useEffect(() => {
    if (!project) return

    // Los <option> de Seguimiento/Programador/Diseñador tienen que existir
    // en el DOM antes de resetear el form, si no el <select> no encuentra
    // el value y queda en blanco.
    Promise.all([fetchSeguimientos(), fetchUsers(), fetchRoles()]).then(() => {
      reset({
        name: project.name,
        descripcion: project.descripcion,
        tipoProyecto: project.tipoProyecto ?? '',
        grupo: project.grupo,
        seguimientoId: String(project.seguimientoId),
        comentario: project.comentario ?? '',
        tecnologia: project.tecnologia ?? '',
        estadoPago: project.estadoPago ?? '',
        estadoProyecto:
          project.estadoProyecto === 'Desarollo' ? 'Desarrollo' : (project.estadoProyecto ?? ''),
        diasSinResponder:
          project.diasSinResponder !== null ? String(project.diasSinResponder) : '',
        fechaEntrega: toDateInputValue(project.fechaEntrega),
        programadorId: project.desarrolladorId != null ? String(project.desarrolladorId) : '',
        disenadorId: project.disenadorId != null ? String(project.disenadorId) : '',
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  const seguimientoOptions = seguimientos.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const programadorOptions = toSelectOptions(getUsersByRoleName(users, roles, 'Programador'))
  const disenadorOptions = toSelectOptions(getUsersByRoleName(users, roles, 'Diseñador'))

  const buildUpdatePayload = (data: ProjectForm): UpdateProjectRequest => ({
    name: data.name.trim(),
    descripcion: data.descripcion.trim(),
    grupo: data.grupo,
    seguimientoId: Number(data.seguimientoId),
    comentario: data.comentario.trim(),
    tipoProyecto: showTipoProyecto
      ? data.tipoProyecto.trim() || null
      : (project?.tipoProyecto ?? null),
    tecnologia: data.tecnologia.trim() || null,
    estadoPago: data.estadoPago.trim(),
    estadoProyecto: data.estadoProyecto.trim(),
    diasSinResponder: data.diasSinResponder.trim() ? Number(data.diasSinResponder) : null,
    fechaEntrega: data.fechaEntrega.trim() || null,
    desarrolladorId: data.programadorId ? Number(data.programadorId) : null,
    disenadorId: data.disenadorId ? Number(data.disenadorId) : null,
  })

  const hasProjectDataChanges = (data: ProjectForm, actual: Project): boolean => {
    const payload = buildUpdatePayload(data)
    return (
      payload.name !== actual.name ||
      payload.descripcion !== actual.descripcion ||
      payload.grupo !== actual.grupo ||
      payload.seguimientoId !== actual.seguimientoId ||
      payload.comentario !== actual.comentario ||
      payload.tecnologia !== actual.tecnologia ||
      payload.tipoProyecto !== actual.tipoProyecto ||
      payload.estadoPago !== actual.estadoPago ||
      payload.estadoProyecto !==
        (actual.estadoProyecto === 'Desarollo' ? 'Desarrollo' : actual.estadoProyecto) ||
      payload.diasSinResponder !== actual.diasSinResponder ||
      toDateInputValue(payload.fechaEntrega) !== toDateInputValue(actual.fechaEntrega)
    )
  }

  const onSubmit = async (data: ProjectForm) => {
    if (!project) return

    const desarrolladorId = data.programadorId ? Number(data.programadorId) : null
    const disenadorId = data.disenadorId ? Number(data.disenadorId) : null
    const responsablesChanged =
      desarrolladorId !== project.desarrolladorId || disenadorId !== project.disenadorId

    const result =
      responsablesChanged &&
      !hasProjectDataChanges(data, project) &&
      desarrolladorId != null &&
      disenadorId != null
        ? await updateProjectResponsables(project.id, { disenadorId, desarrolladorId })
        : await updateProject(project.id, buildUpdatePayload(data))

    if (result.success) {
      onClose()
    } else {
      setError('root', { message: result.error ?? 'Error al guardar el proyecto' })
    }
  }

  return (
    <Modal open={project !== null} onClose={onClose} title="Editar proyecto" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errors.root.message}
          </div>
        )}

        <Input
          label="Nombre"
          placeholder="Ej. Youbi"
          error={errors.name?.message}
          {...register('name', { required: 'El nombre es obligatorio' })}
        />

        <Textarea
          label="Descripción"
          placeholder="Describe el proyecto..."
          error={errors.descripcion?.message}
          {...register('descripcion', { required: 'La descripción es obligatoria' })}
        />

        {showTipoProyecto && (
          <Select
            label="Tipo Proyecto"
            options={TIPO_PROYECTO_OPTIONS}
            placeholder="Selecciona un tipo"
            error={errors.tipoProyecto?.message}
            {...register('tipoProyecto')}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Grupo"
            options={grupoOptions}
            placeholder="Selecciona un grupo"
            error={errors.grupo?.message}
            {...register('grupo', { required: 'Selecciona un grupo' })}
          />

          <Select
            label="Seguimiento"
            options={seguimientoOptions}
            placeholder="Selecciona un seguimiento"
            error={errors.seguimientoId?.message}
            {...register('seguimientoId', { required: 'Selecciona un seguimiento' })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Estado pago"
            placeholder="Ej. 50%, Pagado, Pendiente..."
            {...register('estadoPago')}
          />
          <Select
            label="Estado proyecto"
            options={getEstadoProyectoOptions(
              project?.estadoProyecto ?? '',
              project?.tipoProyecto ?? null,
            )}
            placeholder="Selecciona un estado"
            error={errors.estadoProyecto?.message}
            {...register('estadoProyecto')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tecnología"
            options={TECNOLOGIA_OPTIONS}
            placeholder="Selecciona una tecnología"
            error={errors.tecnologia?.message}
            {...register('tecnologia')}
          />
          <Controller
            name="fechaEntrega"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Fecha de entrega"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Días sin responder"
            type="number"
            min={0}
            placeholder="Ej. 3"
            {...register('diasSinResponder')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Programador"
            options={programadorOptions}
            placeholder="Sin asignar"
            {...register('programadorId')}
          />

          <Select
            label="Diseñador"
            options={disenadorOptions}
            placeholder="Sin asignar"
            {...register('disenadorId')}
          />
        </div>

        <Textarea
          label="Comentario"
          placeholder="Comentario opcional..."
          {...register('comentario')}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
